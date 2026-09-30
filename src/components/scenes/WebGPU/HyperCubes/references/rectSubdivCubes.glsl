// Common

// Settings

#define LETTERBOX 1.0
// #define GEOMETRY_SPHERE
#define FLOOR
// #define PERSPECTIVE

const int ITER = 200;
const float GEOMETRY_SEED = 0.18;
const float GEOMETRY_MARGIN = 0.03;
const float GEOMETRY_FRAME = 0.002;
const float GEOMETRY_DENSITY = 0.8;


// Buffer A

// Scene

#define saturate(i) clamp(i,0.,1.)
#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define reso iResolution

const float PI = acos( -1. );
const float TAU = PI * 2.0;
const float EPSILON = 1E-3;
const float FAR = 30.0;
const float INV_4_PI = 0.25 / PI;
const float PDF_UNIFORM_SPHERE = INV_4_PI;

vec4 seed;

float minV3( vec3 v ) {
  return min( v.x, min( v.y, v.z ) );
}

float maxV3( vec3 v ) {
  return max( v.x, max( v.y, v.z ) );
}

mat2 rotate2D( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

// Ref: https://cs.uwaterloo.ca/~thachisu/tdf2015.pdf
float random() {
  const vec4 q = vec4( 1225, 1585, 2457, 2098 );
  const vec4 r = vec4( 1112, 367, 92, 265 );
  const vec4 a = vec4( 3423, 2646, 1707, 1999 );
  const vec4 m = vec4( 4194287, 4194277, 4194191, 4194167 );
    vec4 beta = floor( seed / q );
    vec4 p = a * ( seed - beta * q ) - beta * r;
    beta = ( sign( -p ) + vec4( 1 ) ) * vec4( 0.5 ) * m;
    seed = ( p + beta );
    return fract( dot( seed / m, vec4( 1, -1, 1, -1 ) ) );
}

vec2 random2() {
  return vec2( random(), random() );
}

vec3 randomSphere() {
  float phi = TAU * random();
  float theta = acos( 1.0 - 2.0 * random() );
  return vec3(
    cos( phi ) * sin( theta ),
    sin( phi ) * sin( theta ),
    cos( theta )
  );
}

vec3 randomHemisphere( vec3 N ) {
  vec3 d = randomSphere();
  return dot( N, d ) < 0.0 ? -d : d;
}

mat3 orthBas( vec3 d ) {
  vec3 z = normalize( d );
  vec3 x = normalize( cross(
    abs( z.y ) < 0.999 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ),
    z
  ) );
  return mat3( x, cross( z, x ), z );
}

vec3 cyclicNoise( vec3 p, vec3 b, float pump ) {
  mat3 bas = orthBas( b );
  vec4 sum = vec4( 0.0 );

  for ( int i = 0; i < 6; i ++ ) {
    p *= bas * 2.0;
    p += sin( p.yzx );
    sum = pump * sum + vec4( cross( sin( p.zxy ), cos( p ) ), 1.0 );
  }

  return sum.xyz / sum.w;
}

vec3 F_Schlick( vec3 f0, float VdotH ) {
  float v = 1.0 - VdotH;
  return mix( f0, vec3( 1.0 ), ( v * v ) * ( v * v ) * v );
}

float G_Smith( float roughness, float NdotV, float NdotL ) {
  float k = roughness;
  k = k * k;
  k /= 2.0;

  float G1V = NdotV / ( NdotV * ( 1.0 - k ) + k );
  float G1L = NdotL / ( NdotL * ( 1.0 - k ) + k );

  return G1V * G1L;
}

vec3 importanceSampleLambert( vec3 N ) {
  float phi = TAU * random();
  float cosTheta = saturate( sqrt( random() ) );
  float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );

  return orthBas( N ) * vec3(
    cos( phi ) * sinTheta,
    sin( phi ) * sinTheta,
    cosTheta
  );
}

vec3 importanceSampleGGX( float roughness, vec3 N ) {
  float phi = TAU * random();
  float cosTheta = random();
  cosTheta = sqrt( ( 1.0 - cosTheta ) / ( 1.0 + ( pow( roughness, 4.0 ) - 1.0 ) * cosTheta ) );
  cosTheta = saturate( cosTheta );
  float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );

  return orthBas( N ) * vec3(
    cos( phi ) * sinTheta,
    sin( phi ) * sinTheta,
    cosTheta
  );
}

struct Material {
  vec3 albedo;
  float roughness;
  float metallic;
  vec3 emissive;
};

struct MarchResult {
  float d;
  Material mtl;
};

struct RectSubdivResult {
  float volume;
  vec3 center;
  vec3 dimension;
  vec3 domainMin;
  vec3 domainMax;
  float id;
};

RectSubdivResult nullSubdiv() {
  RectSubdivResult result;

  result.volume = 0.0;
  result.center = vec3( 0.0 );
  result.dimension = vec3( 0.0 );
  result.domainMin = vec3( 0.0 );
  result.domainMax = vec3( 0.0 );
  result.id = 0.0;

  return result;
}

/**
 * Ref: https://www.shadertoy.com/view/7sKGRy
 * @param p The input position
 * @param scale scale of the domain of the fractal
 */
RectSubdivResult rectSubdiv( vec3 p, vec3 scale ) {
  float t = iTime;

  // several constants
  const int ITERS = 12;
  const int MIN_ITERS = 1;
  const float MIN_SIZE = 0.1;
  const float BREAK_CHANCE = 0.0;

  // the domain of the fractal being generated
  // will be modified in the iteration part
  vec3 domainMin = -scale;
  vec3 domainMax = scale;

  // id of the individual cube in the fractal
  float id = 0.0;

  // random seed of cut positions
  float seed = GEOMETRY_SEED;//floor( t / 6.0 ) + 0.1;

  // size of the current box determined by domainMin / domainMax
  vec3 dimension = domainMax - domainMin;

  for ( int i = 0; i < ITERS; i ++ ) {
    float fi = float( i );

    // divide the box into eight
    vec3 divideHash = vec3(
      fs( dot( vec2( fi + id, seed ), vec2( 1.26, 2.72 ) ) ),
      fs( dot( vec2( fi + id, seed ), vec2( 1.78, 0.47 ) ) ),
      fs( dot( vec2( fi + id, seed ), vec2( 0.78, 2.25 ) ) )
    );
    vec3 divide = divideHash * dimension + domainMin;

    // let the division line cut the box not too thin
    divide = clamp( divide, domainMin + MIN_SIZE, domainMax - MIN_SIZE );

    // does this cut the box to the minimum preferrable size?
    vec3 minSizeOfAxis = min( abs( domainMin - divide ), abs( domainMax - divide ) );
    float minSize = minV3( minSizeOfAxis );
    bool isSmallEnough = minSize <= MIN_SIZE;

    bool willBreak = false;
    if ( i - 1 > MIN_ITERS && fs( id ) < BREAK_CHANCE ) { willBreak = true; }
    if ( isSmallEnough && i - 1 > MIN_ITERS || i == ITERS - 1 ) { willBreak = true; }
    if( willBreak ) {
      // id = i * 0.1 * seed;
      break;
    }

    // update the box domain
    domainMax = mix( domainMax, divide, step( p, divide ) );
    domainMin = mix( divide, domainMin, step( p, divide ) );

    // id will be used for coloring and hash seeding
    vec3 diff = mix( -divide, divide, step( p, divide ) );
    id = length( diff + 10.0 );

    // recalculate the dimension
    dimension = domainMax - domainMin;
  }

  // calculate volume and center of the box
  float volume = dimension.x * dimension.y * dimension.z;
  vec3 center = ( domainMin + domainMax ) / 2.0;

  // prepare the result
  RectSubdivResult result;
  result.volume = volume;
  result.center = center;
  result.dimension = dimension;
  result.domainMin = domainMin;
  result.domainMax = domainMax;
  result.id = id;

  return result;
}

// Ref: https://iquilezles.org/articles/boxfunctions
float tracebox( vec3 ro, vec3 rd, vec3 s ) {
  vec3 m = 1.0 / rd;
  vec3 n = m * ro;
  vec3 k = abs( m ) * s;

  vec3 t1 = -n - k;
  vec3 t2 = -n + k;

  float tN = max( max( t1.x, t1.y ), t1.z );
  float tF = min( min( t2.x, t2.y ), t2.z );

  if( tN > tF || tF < 0.0 ) { return FAR; }

  return tN;
}

float sdbox( vec3 p, vec3 s ) {
  vec3 d = abs( p ) - s;
  return min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) );
}

MarchResult map( vec3 p, RectSubdivResult subdiv ) {
  float d = 1E9, d2;
  Material mtl;

  vec3 pt = p;
  pt -= subdiv.center;

  if ( fs( subdiv.id + 0.0 ) < GEOMETRY_DENSITY ) {
    #ifdef GEOMETRY_SPHERE
      d = length( pt ) - 0.5 * minV3( subdiv.dimension ) + GEOMETRY_MARGIN;
    #else
      d = sdbox( pt, 0.5 * subdiv.dimension - GEOMETRY_MARGIN );
    #endif

    float diceMtl = fs( subdiv.id + 1.0 );

    if ( diceMtl < 0.1 ) {
      mtl.albedo = vec3( 0.8 );
      mtl.roughness = 0.1;
      mtl.metallic = 0.0;
      mtl.emissive = vec3( 11.0, 3.0, 3.0 );
    } else if ( diceMtl < 0.2 ) {
      mtl.albedo = vec3( 0.8, 0.1, 0.1 );
      mtl.roughness = 0.05;
      mtl.metallic = 0.0;
      mtl.emissive = vec3( 0.0 );
    } else {
      vec3 noise = cyclicNoise( p, vec3( -1.0, 3.0, 4.0 ), 2.0 );
      float rough = smoothstep( -0.2, 0.7, noise.y );

      mtl.albedo = vec3( 0.1, 0.11, 0.13 ) * ( 1.0 + 0.4 * rough );
      mtl.roughness = 0.2 + 0.08 * rough;
      mtl.metallic = 0.0;
      mtl.emissive = vec3( 0.0 );
    }
  }

  if ( GEOMETRY_FRAME > 0.0 ) {
    d2 = sdbox( pt, 0.5 * subdiv.dimension + GEOMETRY_FRAME );
    d2 = max( d2, -sdbox( pt, 0.5 * subdiv.dimension + vec3( -1.0, -1.0, 1.0 ) * GEOMETRY_FRAME ) );
    d2 = max( d2, -sdbox( pt, 0.5 * subdiv.dimension + vec3( 1.0, -1.0, -1.0 ) * GEOMETRY_FRAME ) );
    d2 = max( d2, -sdbox( pt, 0.5 * subdiv.dimension + vec3( -1.0, 1.0, -1.0 ) * GEOMETRY_FRAME ) );
    if ( d2 < d ) {
      d = d2;
      mtl.albedo = vec3( 0.7, 0.6, 0.1 );
      mtl.roughness = 0.1;
      mtl.metallic = 1.0;
    mtl.emissive = vec3( 0.0 );
    }
  }

  // shoutouts to slerpy for recommending placing this on the floor
  #ifdef FLOOR
    d2 = p.y + 1.01;
    if ( d2 < d ) {
      d = d2;

      vec3 noise = cyclicNoise( 2.0 * p, vec3( -1.0, 3.0, 4.0 ), 2.0 );
      float rough = noise.y;

      mtl.albedo = vec3( 0.5, 0.04, 0.04 );
      mtl.roughness = 0.15 + 0.04 * rough;
      mtl.metallic = 0.0;
      mtl.emissive = vec3( 0.0 );
    }
  #endif

  pt = p - vec3( -4.0, 3.0, -4.0 );
  d2 = sdbox( pt, vec3( 4.0, 0.1, 4.0 ) );
  if ( d2 < d ) {
    d = d2;
    mtl.albedo = vec3( 0.0 );
    mtl.roughness = 0.05;
    mtl.metallic = 0.0;
    mtl.emissive = 10.0 * vec3( 0.5, 0.62, 1.0 );
  }

  pt = p - vec3( -6.0, 2.0, 6.0 );
  d2 = sdbox( pt, vec3( 4.0, 4.0, 4.0 ) );
  if ( d2 < d ) {
    d = d2;
    mtl.albedo = vec3( 0.0 );
    mtl.roughness = 0.05;
    mtl.metallic = 0.0;
    mtl.emissive = 5.0 * vec3( 0.6, 0.7, 1.0 );
  }

  pt = p - vec3( 8.0, 6.0, 0.0 );
  d2 = sdbox( pt, vec3( 2.0 ) );
  if ( d2 < d ) {
    d = d2;
    mtl.albedo = vec3( 0.0 );
    mtl.roughness = 0.05;
    mtl.metallic = 0.0;
    mtl.emissive = 10.0 * vec3( 0.8, 0.9, 1.0 );
  }

  MarchResult result;
  result.d = d;
  result.mtl = mtl;

  return result;
}

vec3 nMap( vec3 p, vec2 d, RectSubdivResult subdiv ) {
  return normalize( vec3(
    map( p + d.yxx, subdiv ).d - map( p - d.yxx, subdiv ).d,
    map( p + d.xyx, subdiv ).d - map( p - d.xyx, subdiv ).d,
    map( p + d.xxy, subdiv ).d - map( p - d.xxy, subdiv ).d
  ) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord.xy / reso.xy;

  seed = texture( iChannel0, uv );
  seed += float( iFrame );
  random();

  vec2 p = 2.0 * fragCoord.xy / reso.xy - 1.0;
  p.x *= reso.x / reso.y;

  #ifdef LETTERBOX
    if ( abs( p.x ) > LETTERBOX ) {
      fragColor = vec4( 0.0 );
      return;
    }
  #endif

  p += ( 2.0 * random2() - 1.0 ) / reso.xy;

  vec3 cp = vec3( 5.0, 3.0, 5.0 );
  vec3 ct = vec3( 0.0 );
  mat3 cm = orthBas( normalize( cp - ct ) );

  vec3 ro = cm * vec3( 2.0 * p, 5.0 );
  vec3 rd = cm * vec3( 0, 0, -1 );

  #ifdef PERSPECTIVE
    ro = cm * vec3( 0.0, 0.0, 5.0 );
    rd = cm * normalize( vec3( p, -2.0 ) );
  #endif

  vec3 col = vec3( 0 );
  vec3 colRem = vec3( 1 );

  float rl = EPSILON; // will be instantly shortened to lenToNextGrid
  vec3 rp;
  MarchResult result;

  RectSubdivResult subdiv = nullSubdiv();

  float lenToNextGrid = EPSILON;

  for ( int i = 0; i < ITER; i ++ ) {
    if ( rl >= lenToNextGrid ) {
      rl = lenToNextGrid;
      rp = ro + rd * rl;

      bool withinBox = all( lessThan( abs( rp + EPSILON * rd ), vec3( 1.0 ) ) );

      if ( !withinBox ) {
        // trace toward the domain box
        subdiv = nullSubdiv();
        float lenToBox = tracebox( rp + EPSILON * rd, rd, vec3( 1.0 ) );
        lenToNextGrid = rl + lenToBox + EPSILON;
      } else {
        // see the distance to the next cell
        subdiv = rectSubdiv( rp + EPSILON * rd, vec3( 1.0 ) );
        vec3 edgeOfAxis = mix( subdiv.domainMin, subdiv.domainMax, step( 0.0, rd ) );
        vec3 distToEdgeOfAxis = abs( rp - edgeOfAxis ) / ( abs( rd ) + EPSILON );
        float distToEdge = minV3( distToEdgeOfAxis );
        lenToNextGrid = rl + distToEdge + EPSILON;
      }
    }

    if ( rl >= FAR ) { // miss
      break;
    }

    result = map( rp, subdiv );
    rl += 0.7 * result.d;
    rp = ro + rd * rl;

    if ( abs( result.d ) < 1E-3 ) { // hit
      col += result.mtl.emissive * saturate( colRem );

      vec3 N = nMap( rp, vec2( 0.0, mix( 1E-4, 3E-3, result.mtl.metallic ) ), subdiv );

      ro = rp + N * EPSILON;

      vec3 albedo = mix( 0.96 * result.mtl.albedo, vec3( 0.0 ), result.mtl.metallic );
      vec3 f0 = mix( vec3( 0.04 ), result.mtl.albedo, result.mtl.metallic );

      if ( random() < 0.5 ) {
        // specular
        // Ref: http://gregory-igehy.hatenadiary.com/entry/2015/02/26/154142
        vec3 H = importanceSampleGGX( result.mtl.roughness, N );
        vec3 wo = reflect( rd, H );
        if ( dot( wo, N ) < 0.0 ) { break; }

        float VdotH = dot( -rd, H );
        float NdotL = dot( N, wo );
        float NdotH = dot( N, H );
        float NdotV = dot( N, -rd );
        vec3 F = F_Schlick( f0, VdotH );
        float G = G_Smith( result.mtl.roughness, NdotV, NdotL );

        colRem *= max( F * G * max( 0.0, VdotH ) / NdotH * NdotV, 0.0 );
        rd = wo;
      } else {
        // diffuse
        vec3 wo = importanceSampleLambert( N );
        vec3 H = normalize( -rd + wo );

        float VdotH = dot( -rd, H );
        vec3 F = F_Schlick( f0, VdotH );

        colRem *= ( 1.0 - F ) * albedo;
        rd = wo;
      }

      rd = normalize( rd );

      colRem *= 2.0;
      rl = EPSILON;
      lenToNextGrid = EPSILON;
      rp = ro + rd * rl;
    }

    if ( dot( colRem, colRem ) < EPSILON ) { // run out of effective radiance
      break;
    }
  };

  // very random background
  col += colRem * mix(
    vec3( 0.82, 0.03, 0.04 ),
    vec3( 0.07, 0.08, 0.1 ),
    0.5 + 0.5 * rd.y
  );
  // col += colRem * pow( texture( iChannel1, rd ).xyz, vec3( 2.2 ) );

  fragColor = vec4( col, 1.0 );
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

// Buffer C
// Bloom downsample

const float WEIGHT_1 = 1.0;
const float WEIGHT_2 = 2.0;
const float WEIGHT_4 = 4.0;
const vec3 LUMA = vec3( 0.299, 0.587, 0.114 );

bool isValidUV( vec2 uv ) {
  return all( lessThan( abs( uv - 0.5 ), vec2( 0.5 ) ) );
}

vec4 fetch( sampler2D sampler, vec2 uv, float level ) {
  if ( !isValidUV( uv ) ) {
    return vec4( 0.0 );
  }

  float p = pow( 0.5, level ); // 1.0, 0.5, 0.25, 0.125...
  vec2 uvt = level < 0.0 ? uv : ( ( 1.0 - p ) + 0.5 * uv * p );

  vec4 tex = texture( sampler, uvt );
  vec3 col = tex.rgb / tex.a;
  float luma = dot( LUMA, col );
  return vec4( col, 1.0 + 0.5 * luma );
  // return vec4( tex.xyz, 1.0 + luma );
}

vec4 tap13( sampler2D sampler, vec2 uv, float level ) {
  vec2 deltaTexel = pow( 2.0, 1.0 + level ) / iResolution.xy;

  // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
  vec4 tex = WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2( -1.0, -1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  0.0, -1.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2(  1.0, -1.0 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2( -0.5, -0.5 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2(  0.5, -0.5 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2( -1.0,  0.0 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2(  0.0,  0.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  1.0,  0.0 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2( -0.5,  0.5 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2(  0.5,  0.5 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2( -1.0,  1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  0.0,  1.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2(  1.0,  1.0 ), level );
  return tex;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord / iResolution.xy;
  float level = floor( -log2( 1.0 - uv.x ) );
  float p = pow( 0.5, level ); // 1.0, 0.5, 0.25...

  vec2 uv0 = vec2( 1.0 - p );
  vec2 uv1 = uv0 + 0.5 * p;
  uv = ( uv - uv0 ) / ( uv1 - uv0 );

  if ( !isValidUV( uv ) ) {
    fragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    return;
  }

  vec4 tex;
  if ( level == 0.0 ) {
    tex = tap13( iChannel0, uv, level - 1.0 );
  } else {
    tex = tap13( iChannel1, uv, level - 1.0 );
  }

  vec3 col = tex.w > 1E-3 ? tex.rgb / tex.w : vec3( 0.0 );

  if ( level == 0.0 ) {
    float brightness = dot( LUMA, col );
    vec3 normalized = brightness < 1E-4 ? vec3( brightness ) : col / brightness;
    col = max( 0.0, brightness - 1.0 ) * normalized;
  }

  fragColor = vec4( col, 1.0 );
}

// Buffer D
// Bloom upsample

const float WEIGHT_1 = 1.0 / 16.0;
const float WEIGHT_2 = 2.0 / 16.0;
const float WEIGHT_4 = 4.0 / 16.0;

bool isValidUV( vec2 uv ) {
  return all( lessThan( abs( uv - 0.5 ), vec2( 0.5 ) ) );
}

vec4 fetch( sampler2D sampler, vec2 uv, float level ) {
  if ( !isValidUV( uv ) ) {
    return vec4( 0.0 );
  }

  float p = pow( 0.5, level ); // 1.0, 0.5, 0.25, 0.125...
  vec2 uvt = level < 0.0 ? uv : ( ( 1.0 - p ) + 0.5 * uv * p );

  vec4 tex = texture( sampler, uvt );
  return tex;
}

vec4 tap9( sampler2D sampler, vec2 uv, float level ) {
  vec2 deltaTexel = pow( 2.0, 1.0 + level ) / iResolution.xy;

  // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
  vec4 tex = WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2( -1.0, -1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  0.0, -1.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2(  1.0, -1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2( -1.0,  0.0 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2(  0.0,  0.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  1.0,  0.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2( -1.0,  1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  0.0,  1.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2(  1.0,  1.0 ), level );
  return tex;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord / iResolution.xy;

  float level = floor( -log2( 1.0 - uv.x ) );
  float p = pow( 0.5, level ); // 1.0, 0.5, 0.25...

  vec2 uv0 = vec2( 1.0 - p );
  vec2 uv1 = vec2( 1.0 - 0.5 * p );
  uv = ( uv - uv0 ) / ( uv1 - uv0 );

  if ( !isValidUV( uv ) ) {
    fragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    return;
  }

  vec4 tex = tap9( iChannel0, uv, level + 1.0 );
  if ( level < 5.0 ) {
    tex += tap9( iChannel1, uv, level + 1.0 );
  }

  vec3 col = tex.rgb;

  fragColor = vec4( col, 1.0 );
}

// Image

// Present

#define saturate(i) clamp(i,0.,1.)

const float WEIGHT_1 = 1.0 / 16.0;
const float WEIGHT_2 = 2.0 / 16.0;
const float WEIGHT_4 = 4.0 / 16.0;

bool isValidUV( vec2 uv ) {
  return all( lessThan( abs( uv - 0.5 ), vec2( 0.5 ) ) );
}

vec4 fetch( sampler2D sampler, vec2 uv, float level ) {
  if ( !isValidUV( uv ) ) {
    return vec4( 0.0 );
  }

  float p = pow( 0.5, level ); // 1.0, 0.5, 0.25, 0.125...
  vec2 uvt = level < 0.0 ? uv : ( ( 1.0 - p ) + 0.5 * uv * p );

  vec4 tex = texture( sampler, uvt );
  return tex;
}

vec4 tap9( sampler2D sampler, vec2 uv, float level ) {
  vec2 deltaTexel = pow( 2.0, 1.0 + level ) / iResolution.xy;

  // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
  vec4 tex = WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2( -1.0, -1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  0.0, -1.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2(  1.0, -1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2( -1.0,  0.0 ), level );
  tex += WEIGHT_4 * fetch( sampler, uv - deltaTexel * vec2(  0.0,  0.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  1.0,  0.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2( -1.0,  1.0 ), level );
  tex += WEIGHT_2 * fetch( sampler, uv - deltaTexel * vec2(  0.0,  1.0 ), level );
  tex += WEIGHT_1 * fetch( sampler, uv - deltaTexel * vec2(  1.0,  1.0 ), level );
  return tex;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  vec2 p = uv * 2.0 - 1.0;
  p.x *= iResolution.x / iResolution.y;

  #ifdef LETTERBOX
    if ( abs( p.x ) > LETTERBOX ) {
      fragColor = vec4( 0.0 );
      return;
    }
  #endif

  vec4 tex = texture( iChannel0, uv );

  vec3 col = saturate( tex.rgb / tex.a );
  col += tap9( iChannel1, uv, 0.0 ).rgb;
  col = pow( col, vec3( 0.4545 ) );
  col *= 1.0 - 0.2 * length( p );

  fragColor = vec4( col, 1 );
}
