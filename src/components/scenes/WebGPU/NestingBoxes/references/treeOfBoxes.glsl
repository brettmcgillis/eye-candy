// COMMON
struct Box
{
vec3 cen;
vec3 rad;
};

Box createBox( in uint id )
{
Box b = Box( vec3(0.0,0.0,0.0), vec3(4.0,2.0,4.0) );

    uint levels = uint(floor(log2(float(id))));
    for( uint i=0u; i<levels; i++ )
    {
        // i-th node in the root to id-leaf path
        uint bb = id >> (levels-1u-i);

        vec3 ra = sin( float(bb)*21.0 + vec3(0.0,3.0,2.0) );
        vec3 rb = sin( float(bb)*31.0 + vec3(1.0,2.0,4.0) );

        vec3 nrad = b.rad*(0.75+0.2*rb);

        b.cen = b.cen + (b.rad-nrad)*ra;
        b.rad = nrad;
    }
    return b;

}

// BUFFER A

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
ivec2 ip = ivec2(fragCoord);

    if( iFrame>2 || ip.x>=512 || ip.y>128 ) discard;

    int id = (ip.y<<8) + (ip.x>>1);

    Box b = createBox( uint(id) );

    fragColor = vec4( (ip.x&1)==0 ? b.cen : b.rad, 1.0 );

}
// BUFFER B
vec2 boxIntersect( in vec3 ro, in vec3 ird, in Box box ) // return .x>.y is no intersection
{
vec3 n = ird*(box.cen-ro);
vec3 k = abs(ird)*box.rad;
vec3 t1 = n - k;
vec3 t2 = n + k;
return vec2( max( max( t1.x, t1.y ), t1.z ), // near
min( min( t2.x, t2.y ), t2.z )); // far
}

vec3 boxNormal( in vec3 p, in Box box )
{
p -= box.cen;
vec3 w = abs(p)-box.rad;
//return sign(p)*step(w.yzx,w.xyz)*step(w.zxy,w.xyz);
if( w.x>w.y && w.x>w.z ) return vec3( sign(p.x), 0.0, 0.0 );
if( w.y>w.z ) return vec3( 0.0, sign(p.y), 0.0 );
return vec3( 0.0, 0.0, sign(p.z) );
}

//=====================================================================
//
// L0 _ 1 _
// \_/ \_
// / \ Down: node \*= 2
// L1 +2 3
// / \ / \ Up: node /= 2
// L2 4 5 6 7
// / \ / \ / \ / \
// L3 8 9 10 11 12 13 14 15
//
//=====================================================================

Box getBox( in uint id )
{
#if 1
uint x = (id&255u)<<1;
uint y = id>>8;
vec4 a = texelFetch( iChannel3, ivec2(x+0u,y), 0 );
vec4 b = texelFetch( iChannel3, ivec2(x+1u,y), 0 );
return Box( a.xyz, b.xyz );
#else
return createBox( id );
#endif  
}

//=====================================================================

const uint kMaxLevel = 14u;
const uint kMaxNode = 1u<<kMaxLevel;

float iStructure( in vec3 ro, in vec3 rd, out uint oID)
{
vec3 ird = 1.0/rd;

    float res = 1e30;
    uint nod = 1u;                                  // start at the root
    for( uint i=0u; i<=kMaxNode; i++ )
    {
        Box box = getBox( nod );
        vec2 tmp = boxIntersect( ro, ird, box );
        if( tmp.x<tmp.y && tmp.y>0.0 && tmp.x<res ) // if intersects node and closer
        {
            if( nod>=kMaxNode )                     // if leaf
            {
                res = tmp.x;                        // then store
                oID = nod;

                for(;(nod&1u)==1u;nod>>=1);         // and resume
                if( nod==0u ) break;
                nod++;
            }
            else                                    // but if not leaf
            {
                nod <<= 1;                          // then recurse to children
            }
        }
        else                                        // if not intersects node
        {
            for(;(nod&1u)==1u;nod>>=1);             // then skip subtree
            if( nod==0u ) break;
            nod++;
        }
    }
    return res;

}

float iStructureAny( in vec3 ro, in vec3 rd )
{
vec3 ird = 1.0/rd;

    uint nod = 1u;
    for( uint i=0u; i<=kMaxNode; i++ )
    {
        Box box = getBox( nod );
        vec2 res = boxIntersect( ro, ird, box );
        if( res.x<res.y && res.y>0.0 )
        {
            if( nod>=kMaxNode )
                return 0.0;
            else
                nod <<= 1;
        }
        else
        {
            for(;(nod&1u)==1u;nod>>=1);
            if( nod==0u ) break;
            nod++;
        }
    }
    return 1.0;

}

//=====================================================================

vec3 cosineDirection( in vec3 nor, in vec2 r )
{
// fizzer's method
float a = 6.2831853*r.x;
float u = 2.0*r.y - 1.0;
return normalize(nor+vec3(sqrt(1.0-u*u)*vec2(cos(a),sin(a)),u));
}

mat4x4 setCameraToWorld( in vec3 ro, in vec3 ta, float cr )
{
vec3 cw = normalize(ro-ta);
vec3 cp = vec3(sin(cr), cos(cr),0.0);
vec3 cu = normalize( cross(cp,cw) );
vec3 cv = ( cross(cw,cu) );
return mat4x4( cu, 0.0, cv, 0.0, cw, 0.0, ro, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
ivec2 ip = ivec2(floor(fragCoord));

    // random
    ivec2 nc = ip + ivec2(41,11)*iFrame;
    vec4 r = texelFetch( iChannel2, nc&1023, 0 );

    // inputs
    vec2 off = r.xy - 0.5;
    vec2 p = (2.0*(fragCoord+off)-iResolution.xy)/iResolution.y;

    // camera
    float an = 0.5 + 0.03*iTime;
    float cr = 0.2*sin(-0.05*an);
    vec3  ta = vec3(0.4,-0.3,1.10);
    vec3  ro = ta + vec3( 2.5*cos(an), 0.8, 2.5*sin(an) );
    float fl = 3.0;
    mat4x4 cam2world = setCameraToWorld( ro, ta, cr );
    vec3 rd = normalize( (cam2world*vec4(p,-fl,0.0)).xyz );
    //ro = (cam2world*vec4(0.0,0.0,0.0,1.0)).xyz;

    // background
    vec3 col = vec3(0.5+0.3*rd.y);
    float t = 1e30;

    // intersect
    uint id = 0u;
    float res = iStructure( ro, rd, id );
    if( res<1e29 )
    {
        t = res;
        vec3 pos = ro + t*rd;
        vec3 nor = boxNormal( pos, getBox(id) );

        // material
        vec3 mate = abs(nor.x)*texture( iChannel1, 2.0*pos.yz ).xyz +
                    abs(nor.y)*texture( iChannel1, 2.0*pos.zx ).xyz +
                    abs(nor.z)*texture( iChannel1, 2.0*pos.xy ).xyz;
        mate *= 0.55 + 0.45*sin(float(id)*0.5+vec3(0.0,0.5,1.0));

        // lighting
        col = vec3(0.0);

        // key light
        {
    	vec3 light1 = normalize( vec3(-0.8,0.7,0.5) );
        float dif = clamp(dot(nor,light1),0.0,1.0);
        if( dif>0.001 ) dif *= iStructureAny( pos+nor*0.001, light1 );
        col += mate*dif*vec3(6.0,5.0,4.0);
        vec3  hal = normalize( light1-rd);
        float fre = 0.04 + 0.96*pow( clamp(dot(hal,-rd),0.0,1.0), 5.0 );
        float spe = pow(clamp(dot( nor, hal ),0.0,1.0),8.0)*80.0*mate.x*fre;
        col += spe*dif;
        }
        // dome light
        {
        vec3 rr = cosineDirection( nor, r.zw );
        if( rr.y>0.0 )
        col += mate*iStructureAny( pos+nor*0.001, rr );
        }
    }

    //------------------------------------------
    // reproject from previous frame and average
    //------------------------------------------

    mat4 oldCam2world = mat4( texelFetch(iChannel0,ivec2(0,0), 0),
                              texelFetch(iChannel0,ivec2(1,0), 0),
                              texelFetch(iChannel0,ivec2(2,0), 0),
                              texelFetch(iChannel0,ivec2(3,0), 0) );
    mat4 oldWorldToCam = inverse(oldCam2world);

    // world space
    vec4 wpos = vec4(ro + rd*t,1.0);
    // world to camera
    vec3 cpos = (oldWorldToCam*wpos).xyz;
    // camera to ndc
    vec2 npos = -fl * cpos.xy / cpos.z;
    // ndc to raster (inverse of line 157)
    vec2 rpos = 0.5*(iResolution.xy + iResolution.y*npos) - off - 0.5;

    ivec2 ipos = ivec2(floor(rpos));
    // blend pixel color history
    if( (ipos.y>0 || ipos.x>2) && iFrame>0 && t<1e29 )
    {
        #if 1
        vec2 fuv = rpos - vec2(ipos);
        vec4 odata1 = texelFetch( iChannel0, ipos+ivec2(0,0), 0 );
        vec4 odata2 = texelFetch( iChannel0, ipos+ivec2(1,0), 0 );
        vec4 odata3 = texelFetch( iChannel0, ipos+ivec2(0,1), 0 );
        vec4 odata4 = texelFetch( iChannel0, ipos+ivec2(1,1), 0 );
        vec4 ocol = vec4(0.0);
        int n = 0;
        if( abs(t-odata1.w)<0.1 ) { ocol += vec4( odata1.xyz, 1.0)*(1.0-fuv.x)*(1.0-fuv.y); n++; }
        if( abs(t-odata2.w)<0.1 ) { ocol += vec4( odata2.xyz, 1.0)*(    fuv.x)*(1.0-fuv.y); n++; }
        if( abs(t-odata3.w)<0.1 ) { ocol += vec4( odata3.xyz, 1.0)*(1.0-fuv.x)*(    fuv.y); n++; }
        if( abs(t-odata4.w)<0.1 ) { ocol += vec4( odata4.xyz, 1.0)*(    fuv.x)*(    fuv.y); n++; }
        if( n>0 ) col = mix( max(ocol.xyz/ocol.w,0.0), col, 0.15 );
    	#else
        col = mix( textureLod( iChannel0, (rpos+0.5)/iResolution.xy, 0.0 ).xyz, col, 0.15 );
        #endif
    }

    // output
    fragColor = (ip.y==0 && ip.x<=3) ? cam2world[ip.x] : fragColor = vec4( col, t );

}

// IMAGE

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
vec2 q = fragCoord / iResolution.xy;

    #if 0
    // source
    vec3 col = texelFetch( iChannel0, ivec2(fragCoord), 0 ).xyz;
    #endif

    // dof
    #if 0
    const float focus = 2.2;
    vec4 acc = vec4(0.0);
    const int N = 9;
    for( int j=-N; j<=N; j++ )
    for( int i=-N; i<=N; i++ ) // 81 samples
    {
        vec2 off = vec2(float(i),float(j));

        vec4 tmp = textureLod( iChannel0, q + off/vec2(800.0,450.0), 0.0 );
        float depth = min(tmp.w,10.0);
        vec3  color = tmp.xyz;
        float coc   = 0.02 + 9.0*abs(depth-focus)/depth;
        if( dot(off,off) < (coc*coc) )
        {
            float w = 1.0/(coc*coc);
            acc += vec4(color*w,w);
        }
    }
    vec3 col = acc.xyz / acc.w;
    #else
    const float focus = 2.2;
    const ivec2 kV = ivec2(32,13);
    float ar = texelFetch(iChannel1,ivec2(fragCoord)&1023,0).x;
    vec4 acc = vec4(0.0);
    for( int i=0; i<kV.x; i++ ) // 32 samples
    {
        float rad = float(i)/float(kV.x-1);
        float ang = float(kV.y)*6.283185*rad + 6.283185*ar;
        vec2  off = 9.0*sqrt(rad)*vec2(cos(ang),sin(ang));

        vec4  tmp = textureLod( iChannel0, q + off/vec2(800.0,450.0), 0.0 );
        float depth = min(tmp.w,10.0);
        vec3  color = tmp.xyz;
        float coc   = 0.02 + 9.0*abs(depth-focus)/depth;
        if( dot(off,off) < (coc*coc) )
        {
            float w = 1.0/(coc*coc);
            acc += vec4(color*w,w);
        }
    }
    vec3 col = acc.xyz / acc.w;
    #endif

    // gain
    col *= 1.8/(1.5+col);

    // gamma
    col = pow( col, vec3(0.4545) );

    // vignette
    col *= 0.5 + 0.5*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );

    // output
    fragColor = vec4( col, 1.0 );

}
