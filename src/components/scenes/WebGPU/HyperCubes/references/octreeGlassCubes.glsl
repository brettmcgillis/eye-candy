// Buffer A

// Draw

// Originally made with Blossom, the 4k exegfx framework
// https://github.com/lunasorcery/Blossom

float TAU = acos( -1. ) * 2.0;

uvec3 pcg3d( uvec3 s ) {
  s = s * 1145141919u + 1919810u;

  s.x += s.y * s.z;
  s.y += s.z * s.x;
  s.z += s.x * s.y;

  s ^= s >> 16;

  s.x += s.y * s.z;
  s.y += s.z * s.x;
  s.z += s.x * s.y;

  return s;
}

vec3 pcg3df( vec3 s ) {
  uvec3 r = pcg3d( floatBitsToUint( s ) );
  return vec3( r ) / float( -1u );
}

uvec3 seed;
vec3 random3() {
  seed = pcg3d( seed );
  return vec3( seed ) / float( -1u );
}

float safeDot( vec3 a, vec3 b ) {
  return clamp( dot( a, b ), 0.0001, 1.0 );
}

mat3 orthBas( vec3 d ) {
  vec3 z = normalize( d );
  vec3 x = normalize( cross(
    abs( z.y ) < 0.999 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ),
    z
  ) );
  return mat3( x, cross( z, x ), z );
}

vec3 importanceSampleLambert( vec3 N ) {
  vec3 dice = random3();
  float phi = TAU * dice.x;
  float cosTheta = clamp( sqrt( dice.y ), 0.0, 1.0 );
  float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );

  return orthBas( N ) * vec3(
    cos( phi ) * sinTheta,
    sin( phi ) * sinTheta,
    cosTheta
  );
}

vec3 importanceSampleGGX( float roughness, vec3 N ) {
  vec3 dice = random3();
  float phi = TAU * dice.x;
  float cosTheta = dice.y;
  cosTheta = clamp(
    sqrt( ( 1.0 - cosTheta ) / ( 1.0 + ( pow( roughness, 4.0 ) - 1.0 ) * cosTheta ) ),
    0.0,
    1.0
  );
  float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );

  return orthBas( N ) * vec3(
    cos( phi ) * sinTheta,
    sin( phi ) * sinTheta,
    cosTheta
  );
}

vec4 isectBox( vec3 ro, vec3 rd, vec3 s ) {
  vec3 xo = -ro / rd;
  vec3 xs = abs( s / rd );

  vec3 dfv = xo - xs;
  vec3 dbv = xo + xs;

  float df = max( dfv.x, max( dfv.y, dfv.z ) );
  float db = min( dbv.x, min( dbv.y, dbv.z ) );
  if ( df < 0.0 || db < df ) { return vec4( 100.0 ); }

  vec3 n = -sign( rd ) * step( vec3( df ), dfv );
  return vec4( n, df );
}

vec4 isectIBox( vec3 ro, vec3 rd, vec3 s ) {
  vec3 xo = -ro / rd;
  vec3 xs = abs( s / rd );

  vec3 dbv = xo + xs;

  float db = min( dbv.x, min( dbv.y, dbv.z ) );
  if ( db < 0.0 ) { return vec4( 100.0 ); }

  vec3 n = -sign( rd ) * step( dbv, vec3( db ) );
  return vec4( n, db );
}

vec4 isectPlane( vec3 ro, vec3 rd, vec3 n ) {
  float t = -dot( ro, n ) / dot( rd, n );
  return mix( vec4( 100.0 ), vec4( n, t ), step( 0.0, t ) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord / iResolution.xy;

  seed = uvec3( fragCoord, iFrame );

  vec2 p = 2.0 * fragCoord / iResolution.xy - 1.0;
  p.x *= iResolution.x / iResolution.y;

  if ( abs( p.x ) > 1.0 ) {
    fragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    return;
  }

  float inMedium = 0.0;

  vec3 cp = vec3( 10.0, 6.0, 10.0 );
  mat3 cm = orthBas( normalize( cp ) );

  vec3 ro, rd;

  vec3 dice;
  float ampRem;
  float amp;
  float wave;
  float ior;
  vec4 col = vec4( 0.0 );

  vec4 isect, isect2, octree;

  for ( int i = 0; i < 100; i ++ ) {
    // this makes the compile faster for some reason
    if ( col.w == 1.5 ) { break; }

    if ( ampRem < 0.001 ) {
      // cringe
      col += vec4(
        amp * smoothstep( 0.1, 0.0, abs( wave - vec3( 0.7, 0.6, 0.5 ) ) ),
        1.0
      );

      ro = cp + cm * vec3( 2.0 * ( p + 2.0 * random3().xy / iResolution.y ), 0.0 );
      rd = cm * vec3( 0.0, 0.0, -1.0 );
      ampRem = 4.0;
      amp = inMedium = 0.0;
      wave = mix( 0.4, 0.8, random3().x );
      ior = 1.4 + 0.04 / wave / wave; // cringe
    }

    if ( inMedium == 1.0 ) {
      isect = isectBox( ro - octree.xyz, rd, vec3( octree.w - 0.01 ) * 0.5 );

      if ( isect.w < 100.0 ) {
        amp += ampRem;
        ampRem *= 0.0;
      } else {
        isect = isectIBox( ro - octree.xyz, rd, vec3( octree.w - 0.01 ) );
        ro += isect.w * rd;

        // cringe
        vec3 H = importanceSampleGGX( 0.7 * pcg3df( dice ).x, isect.xyz );
        vec3 wo = refract( rd, H, ior );
        if ( wo == vec3( 0.0 ) ) {
          rd = reflect( rd, H );
        } else {
          rd = wo;
          inMedium = 0.0;
          ampRem *= 0.7;
        }

        ro += 0.001 * rd;
      }

      continue;
    }

    isect = vec4( 100.0 );

    float octreeBBB = isectIBox( ro, rd, vec3( 1.0 ) ).w;
    if ( octreeBBB < 100.0 ) {
      float tl = isectBox( ro, rd, vec3( 1.0 ) ).w;
      tl = mix( tl, 0.0, step( 100.0, tl ) );

      for ( int i = 0; i < 20; i ++ ) {
        float isHole = 0.0;
        octree = vec4( 1.0 );

        for ( int i = 0; i < 5; i ++ ) {
          octree = vec4(
            floor( ( ro + rd * ( tl + 0.005 ) ) / octree.w ) + 0.5,
            0.5
          ) * octree.w;

          dice = pcg3df( 66.0 + octree.xyz );

          if ( dice.y < 0.2 || abs( octree.x ) > 1.0 || abs( octree.y ) > 1.0 || abs( octree.z ) > 1.0 ) {
            isHole = 1.0;
            break;
          }

          if ( dice.x < 0.5 ) { break; }
        }

        isect = mix(
          isectBox( ro - octree.xyz, rd, vec3( octree.w - 0.01 ) ),
          vec4( 100.0 ),
          isHole
        );

        if ( isect.w < 100.0 ) {
          break;
        } else {
          tl = isectIBox( ro - octree.xyz, rd, vec3( octree.w ) ).w;
          if ( octreeBBB < tl ) { break; }
        }
      }
    }

    float roughness = 0.1;
    float baseColor = mix( 0.04, 0.8, step( 0.4, dice.z ) );
    float emissive = 0.0;

    isect2 = isectPlane( ro + vec3( 0.0, 1.0, 0.0 ), rd, vec3( 0.0, 1.0, 0.0 ) );
    if ( isect2.w < isect.w ) {
      isect = isect2;
      roughness = 0.2;
      baseColor = 0.03;
      dice *= 0.0;
    }

    isect2 = isectBox( ro - vec3( 0.0, 7.0, 0.0 ), rd, vec3( 4.0, 1.0, 4.0 ) );
    if ( isect2.w < isect.w ) {
      isect = isect2;
      roughness = 1.0;
      baseColor = 0.0;
      emissive = 2.0;
      dice *= 0.0;
    }

    isect2 = isectBox( ro - vec3( 7.0, 0.0, 0.0 ), rd, vec3( 2.0 ) );
    if ( isect2.w < isect.w ) {
      isect = isect2;
      roughness = 1.0;
      baseColor = 0.0;
      emissive = 1.0;
      dice *= 0.0;
    }

    if ( isect.w < 100.0 ) {
      ro += isect.w * rd;

      amp += emissive * ampRem;

      if ( dice.z > 0.8 ) {
        // cringe
        vec3 H = importanceSampleGGX( 0.7 * pcg3df( dice ).x, isect.xyz );
        rd = refract( rd, H, 1.0 / ior );
        inMedium = 1.0;
        ro += 0.001 * rd;
        continue;
      }

      float NdotV = safeDot( isect.xyz, -rd );
      float Fn = mix( 0.04, 1.0, pow( 1.0 - NdotV, 5.0 ) );

      if ( random3().x < Fn ) {
        // specular
        vec3 H = importanceSampleGGX( roughness, isect.xyz );
        vec3 wo = reflect( rd, H );
        if ( dot( wo, isect.xyz ) < 0.0 ) {
          ampRem *= 0.0;
          continue;
        }

        float VdotH = safeDot( -rd, H );
        float NdotL = safeDot( isect.xyz, wo );
        float NdotH = safeDot( isect.xyz, H );
        float Fh = mix( 0.04, 1.0, pow( 1.0 - VdotH, 5.0 ) );

        // g_smith
        roughness *= roughness / 2.0;

        float G1V = NdotV / ( NdotV * ( 1.0 - roughness ) + roughness );
        float G1L = NdotL / ( NdotL * ( 1.0 - roughness ) + roughness );

        float G =
          NdotV / ( NdotV * ( 1.0 - roughness ) + roughness ) * // G1V
          NdotL / ( NdotL * ( 1.0 - roughness ) + roughness ); // G1L

        ampRem *= Fh / Fn * G * VdotH / ( NdotH * NdotV );
        rd = wo;
      } else {
        // diffuse
        vec3 wo = importanceSampleLambert( isect.xyz );
        vec3 H = normalize( -rd + wo );
        if ( dot( wo, isect.xyz ) < 0.0 ) {
          ampRem *= 0.0;
          continue;
        }

        float VdotH = safeDot( -rd, H );
        float Fh = mix( 0.04, 1.0, pow( 1.0 - VdotH, 5.0 ) );

        ampRem *= ( 1.0 - Fh ) / ( 1.0 - Fn ) * baseColor;
        rd = wo;
      }

      ro += 0.001 * rd;
    } else {
      ampRem *= 0.0;
    }
  }

  fragColor = col / col.w;
}


// Buffer B
// Accumulate

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord.xy / iResolution.xy;

  // accumulate using backbuffer
  fragColor = texture( iChannel0, uv );

  if ( iFrame > 1 && iMouse.w < 0.5 ) {
    fragColor += texture( iChannel1, uv );
  }
}


// Image

// Present

#define saturate(i) clamp(i,0.,1.)

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec4 tex = texelFetch( iChannel0, ivec2( fragCoord ), 0 );

  vec3 color = tex.rgb / tex.a * vec3( 1.0, 1.2, 1.3 ); // cringe
  color = mix(
    12.92 * color,
    pow( 1.055 * color, vec3( 1.0 / 2.4 ) ) - 0.055,
    step( 0.0031308, color )
  );

  fragColor = vec4( color, 1 );
}
