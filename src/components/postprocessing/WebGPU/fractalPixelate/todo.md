# // FractalPixelate

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

## // TODO:

Noise-driven quadtree pixelation — a screen-space pixelation grid whose cell
size subdivides per-cell via bounded per-level hash noise, instead of a
uniform grid. Core logic in `src/modules/tsl/fractalPixelate.js`, usable both as
a fullscreen post effect (`FractalPixelate.jsx`, this folder) and as a
per-object `backdropNode` (see LoGlow's Logo shells for an example).

- [ ] Content-aware quadtree: replace (or add as a mode alongside) the
      noise-driven subdivision with a variance/edge-driven one — build a
      mip-like pyramid of block-averages via compute passes, then have the
      final pass walk the pyramid so busy/detailed areas get finer pixels and
      flat areas stay chunky. Meaningfully more complex (several compute
      shaders) than the current single-pass approach; deferred until the
      noise-driven version has been used/seen in a few scenes.
- [ ] Tri-xels, & Tri-tree
- [ ] interactive pixelation. increase or decrease quad/tri size around cursor

## // Presets

## // Features

## // Interactivity

## // Bugs

## // Examples

```glsl
void mainImage( out vec4 o,  vec2 U )
{
    o*=0.;
    float r=.1, t=iTime, H = iResolution.y;
    U /=  H;                              // object : disc(P,r)
    vec2 P = .5+.5*vec2(cos(t),sin(t*.7)), fU;
    U*=.5; P*=.5;                         // unzoom for the whole domain falls within [0,1]^n

    o.b = .25;                            // backgroud = cold blue

    for (int i=0; i<7; i++) {             // to the infinity, and beyond ! :-)
        fU = min(U,1.-U); if (min(fU.x,fU.y) < 3.*r/H) { o--; break; } // cell border
    	if (length(P-.5) - r > .7) break; // cell is out of the shape

                // --- iterate to child cell
        fU = step(.5,U);                  // select child
        U = 2.*U - fU;                    // go to new local frame
        P = 2.*P - fU;  r *= 2.;

        o += .13;                         // getting closer, getting hotter
    }

	o.gb *= smoothstep(.9,1.,length(P-U)/r); // draw object
}













/* // for the record: a 282 chars version

void mainImage( out vec4 o, vec2 U )
{
    float r=.1, t=iDate.w, H = iResolution.y;
    U *=  .5/H;
    vec2 P = .25+.25*vec2(cos(t),sin(t*.7)), f;

    o -= o; o.b = .25;

    for (int i=0; i<7; i++) {
        f = min(U,1.-U); if (min(f.x,f.y) < 3.*r/H)  o--;
    	if (length(P-.5) - r < .7)
        	f = step(.5,U),
        	U += U - f,
        	P += P - f,  r += r,
        	o += .13;
    }

	o.gb *= step(r,length(P-U));
}

/**/
```

```glsl
void mainImage( out vec4 o,  vec2 U )
{
    o = vec4(0.0);
    float r=.2, z=4., t=iTime, H = iResolution.y, uz;
    U /=  H;                              // object : disc(P,r)
    vec2 P = .5+.5*vec2(cos(t),sin(t*.7)), C=vec2(-.7,0), fU;
    U =(U-C)/z; P=(P-C)/z; r/= z;         // unzoom for the whole domain falls within [0,1]^n

    mat2 M = mat2(1,0,.5,.87), IM = mat2(1,0,-.577,1.155);
    U = IM*U;         // goto triangular coordinates (there, regular orthonormal grid + diag )

    o.b = .25;                            // backgroud = cold blue

    for (int i=0; i<7; i++) {             // to the infinity, and beyond ! :-)
        fU = min(U,1.-U); uz = 1.-U.x-U.y;
        if (min(min(fU.x,fU.y),abs(uz)) < z*r/H) { o--; break; } // cell border
    	if (length(P-M*vec2(.5-sign(uz)/6.)) - r > .6) break;    // cell is out of the shape

                // --- iterate to child cell
        fU = step(.5,U);                  // select grid-child
        U = 2.*U - fU;                    // go to new local frame
        P = 2.*P - M*fU;  r *= 2.;

        o += .13;                         // getting closer, getting hotter
    }

	o.gb *= smoothstep(.9,1.,length(P-M*U)/r); // draw object
}
```

```glsl
// created by florian berger (flockaroo) - 2023
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// multiscale trixels in 2 tweets of code (560 chars)

// original version (560 chars)

/*#define R(x) mat2(cos(x-vec4(0,33,11,0)))
#define C(x) texture(iChannel0,(x)/r+.5)

void mainImage( out vec4 O, in vec2 C )
{
    vec2 q,r=iResolution.xy,u,v,w,c,f,x=vec2(1,0);
    float z,s=r.y/2e2;
    mat2 m=R(iTime*.1)*mat2(1,0,.5,.9)*s;

    vec4 G,H;
    for(;s<r.y;s*=2.,m*=2.) {
        q=inverse(m)*(C-r*.5); f=fract(q);
        u=m*(q-f); v=u+m*x; w=u+m*x.yx;
        if((z=1.-f.x-f.y)<0.) { u=w; w=u+m*x.xx; }
        G=C(c=(u+v+w)/3.);
        if( dot(max(max(abs(C(v+w-c)-G),abs(C(w+u-c)-G)),abs(C(u+v-c)-G)),x.xxxy)>.17 ) break;
    }
    O=G-.27*exp2(-f.x*20.)*(H=vec4(1.13,1,.87,1))
           -.23*exp2(-f.y*30.)*H.zxyw;
    if(z<0.) O-=.2*exp2(z*60.)*H.yzxw;
}*/

// much smaller now thx to fabrice!! (509 chars)

#define C(x) texture(iChannel0, (x)/r +.5 )

void mainImage( out vec4 O, vec2 C )
{
    vec2  q, u=C-C,v=u,w=u,c,f, r = iResolution.xy;
    float z, s = 0.;
    vec4  H = vec4(1.13,1,.87,0);

    for( mat2 m =  mat2(cos(iTime*.1-vec4(0,33,1,34)))*r.y/2e2
       ; O = C( c = (u+v+w)/3. ),
         dot(max(max(abs( C(v+w-c) - O ),
                     abs( C(w+u-c) - O )),
                     abs( C(u+v-c) - O )),
             H.yyyw) < .17 && ++s < 9.
       ; m+=m)
        q = inverse(m) * ( C - r*.5 ),
        f = fract(q),
        u = m*(q-f), v = u + m[0], w = u + m[1],
        z = 1.-f.x-f.y,
        z < 0. ?  u = w, w += m*H.yy : w;


    O -=   .27/ exp(f.x*14.)*H
         + .23/ exp(f.y*21.)*H.zxyw
         +  .2* exp( z<0.? z*42.: -s )*H.yzxw;
     //  +  .2/ exp(  z*42.)*H.yzxw * step(-z,0.);  // also quite interesting - visually some tiles sunken some raised

}

```
