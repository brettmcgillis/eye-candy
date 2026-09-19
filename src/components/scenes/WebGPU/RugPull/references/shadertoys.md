# Rug Pull — Shadertoy references

These are the original sources that `utils/patterns/` ports. Compare the
Fullscreen layout against them. They are copied here verbatim because
Shadertoy's Cloudflare check blocks scripted fetches. Shadertoy's default
license is CC BY-NC-SA 3.0, so credit the authors.

| id                                              | name                      | author | file           | notes                                 |
| ----------------------------------------------- | ------------------------- | ------ | -------------- | ------------------------------------- |
| [stcGRH](https://www.shadertoy.com/view/stcGRH) | Persian carpet 7          | jarble | channelLoop.js | `t2`/`t3` and `hash31` are dead code  |
| [ssSXDm](https://www.shadertoy.com/view/ssSXDm) | Persian rug               | jarble | channelLoop.js | `c1` alternates listed                |
| [Wlyfzw](https://www.shadertoy.com/view/Wlyfzw) | Oriental rug              | jarble | channelLoop.js | `c1` alternates listed                |
| [fl3GDB](https://www.shadertoy.com/view/fl3GDB) | Persian carpet 18         | jarble | channelLoop.js | hash-jittered folds, reseed every 20s |
| [ddVXRm](https://www.shadertoy.com/view/ddVXRm) | Black and white rug       | jarble | feedback.js    | mono; has a sound pass (ignored)      |
| [NtKcRG](https://www.shadertoy.com/view/NtKcRG) | Red and blue rug          | jarble | feedback.js    | channel swap on `uv.x < uv.y`; sound  |
| [M3jSWc](https://www.shadertoy.com/view/M3jSWc) | Red and black rug (music) | jarble | feedback.js    | `transform()` helper; sound           |
| [lfs3Wn](https://www.shadertoy.com/view/lfs3Wn) | Green and gold flower rug | jarble | feedback.js    | sin/cos warp on a second orbit; sound |
| [ssjfR3](https://www.shadertoy.com/view/ssjfR3) | Fractal knots 7           | jarble | knots.js       | 15×3 nested folds                     |
| [ssyyDR](https://www.shadertoy.com/view/ssyyDR) | Frost fractal pattern     | jarble | knots.js       | 6×3 nested folds                      |
| [7lGfWt](https://www.shadertoy.com/view/7lGfWt) | Funky Motherboard Carpet  | leon   | motherboard.js | a different technique (see below)     |

## What they share

Ten of the 11 are jarble's triangle-wave fold fractals. Each one repeatedly
applies `abs(fract((a + c1.xy) * scale) - .5)` to `uv`, sometimes with swapped
axes, and reads color from `uv.x - uv.y`. The only animation is a slow `iTime`
pan, plus the hash reseed in fl3GDB. Each shader's pattern depends on
its constants (`c1`, `scale`, `offset`, `scale2`), and several sources list
alternate `c1` values in comments.

- **channel-loop**: an outer loop over R, G, B keeps folding the same `uv`, so
  each color channel is a deeper stage of the same orbit.
- **t2-feedback**: fixed `a2 = (1, .5)` and `scale = 1.5`. A `t2` term feeds
  back between 9 and 15 iterations.
- **knot/frost**: nested `k < 3` loops with `uv.yx = (t2 ± t3) / scale`.
- **7lGfWt (leon)**: not a fold fractal. It splits the screen into a 4×4 grid,
  hashes a seed per cell (reseeded every 10s), runs a kaleidoscope SDF loop,
  and adds glow, a cosine palette and scanline glow.

## Sources

### stcGRH — Persian carpet 7 (jarble)

```glsl
//change these constants to get different patterns!
#define c2 1.5

#define c1 vec4(1.0+c2,.5+c2,-1.5,0)

//to do: drag and drop using https://www.shadertoy.com/view/WdGGWh

//----------------------------------------------------------------------------------------
// 3 out, 1 in...
vec3 hash31(float p)
{
//from David Hoskins' "Hash without sine"
vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
p3 += dot(p3, p3.yzx+33.33);
return fract((p3.xxy+p3.yzz)*p3.zyx);
}

vec2 triangle_wave(vec2 a,float scale){
return abs(fract((a+c1.xy)*scale)-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);

vec3 col;
float t1 = 4.5*3./2.;
float t = 45.87+iTime/2.;
vec2 uv = (fragCoord-iResolution.xy)/iResolution.y/t1/128.0/2.;
uv += vec2(t/2.0,t/3.0)/t1/128.0/4.;
//vec3 random1 = hash31(floor((iTime)/10.0+uv.x))*10.*.0;
float t2 = floor((t+4.)/20.0+uv.x);
//vec3 random2 = hash31(1.+t2);

float offset = -.05;

for(int c=0;c<3;c++){
float scale = c1.z;
float t3 = float(c)+t2;

for(int i=0;i<3;i++)
{
vec3 col_prev = col;
float factor = .7;
float factor1 = 8.;

uv = -triangle_wave(uv.yx+scale,scale)+triangle_wave(uv,scale);
//uv.y /= .9;
uv.x *= factor;
for(int j = 0; j < 3;j++){
uv = triangle_wave((uv*(1.+offset)),scale);
}
uv.x /= -factor;

if(i>0) col = abs(col.yzx*col.x + col_prev*col.y)/(col.x-col.y);

col[c] = fract((uv.x*(1.+col.x/factor1))-(uv.y*(col.y/factor1+1.)));
}
}

fragColor = vec4(vec3(col),1.0);

}
```

### ddVXRm — Black and white rug (jarble)

```glsl
#define fmod(x,y) mod(floor(x),y)
vec2 triangle_wave(vec2 a){
vec2 a2 =
vec2(1.,.5)
,
a1 = a+a2;
return abs(fract((a1)*(a2.x+a2.y))-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
vec3 col = vec3(0.);
float t1 = 8.;
vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv.x += iTime/t1/12.0;
if(iMouse.z>.5)
uv = uv.xy + iMouse.xy / iResolution.xy/t1;
float scale = 1.5;
vec2 t2 = vec2(0.);
for(int k = 0; k < 12; k++){
uv = abs(uv+t2+.5);
t2 =
triangle_wave(uv+.5)/scale
//triangle_wave(uv-.5*sign(t2.y-uv.x))/scale
;
uv = (t2-triangle_wave(uv.yx))/1.5;
col.x =
max(length(uv+t2)/2.,col.x)
;
col.x =
max(abs(col.x-(1.-col.x)),col.x/4.);
}
fragColor = vec4(vec3(col.x),1.0);
}
```

### ssjfR3 — Fractal knots 7 (jarble)

```glsl
//change these constants to get different patterns!
#define c1 vec3(1.,0.5,1.5)

vec2 triangle_wave(vec2 a,float scale){
//a = -a;
return abs(fract((a+c1.xy)*scale)-.5);
//return abs(fract((a+c1.xy)*scale+iTime/500.)-.5); //morphing
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
vec3 col;
float t1 = 36.*8.;
vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
float scale = c1.z;
float offset1 = iTime/1000.;
for(int i=0;i<15;i++)
{
vec2 t2 = vec2(0.);
vec2 t3 = vec2(0.);
for(int k = 0; k < 3; k++){
uv += t2.yx;
uv /= -scale;
vec2 temp = t2;
t2 = triangle_wave(uv.yx-.5,scale);
t3 = triangle_wave(uv,scale);
uv.yx = (t2+t3)/scale;
t2 /= (1.5+temp.yx);
}
col.x = abs(uv.y-uv.x+col.x);
col = col.yzx;
}
fragColor = vec4(col,1.0);
}
```

(Commented-out experiment lines inside the `k` loop were dropped. See the
Shadertoy page for them.)

### ssyyDR — Frost fractal pattern (jarble)

```glsl
#define c1 vec3(1.,0.5,1.5)

vec2 triangle_wave(vec2 a,float scale){
return abs(fract((a+c1.xy)*scale)-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
vec3 col = vec3(0.);
float t1 = 16.*16.*8.;
vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
float scale = c1.z;
float offset = 0.;
float offset1 = iTime/1000.;
for(int i=0;i<6;i++)
{
vec2 t2 = vec2(0.);
vec2 t3 = vec2(0.);
for(int k = 0; k < 3; k++){
//t2.yx /= scale; //this makes another nice pattern

uv += 1.+(t2.yx);
t2 = triangle_wave(uv.yx-.5,scale);
t3 = triangle_wave(uv,scale);
uv.yx = (t2-t3)/(scale);
}
col.x = (((uv.y+uv.x)+col.x))/sqrt(3.);
col = abs(col+vec3(col.x))/sqrt(3.);
}
fragColor = vec4((col*3.),1.0);
}
```

### ssSXDm — Persian rug (jarble)

```glsl
//change these constants to get different patterns!
#define c2 0.0

#define c1 vec4(2.0+c2,2.5+c2,1.4,0)
//#define c1 vec4(2.0+c2,1.5+c2,1.4,0)
//#define c1 vec4(1.0,1.5,1.4,0)
//#define c1 vec4(7.0,5.0,1.4,0)
//#define c1 vec4(7.0,9.0,1.4,0)
//#define c1 vec4(5.0,5.5,1.4,0)

vec2 triangle_wave(vec2 a,float scale){
return abs(fract((a+c1.xy)*scale)-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
vec3 col;
float t1 = 4.5;
float offset = .18;
float scale2 = 1.05;
vec2 uv = (fragCoord-iResolution.xy)/iResolution.y/t1/2.0;
uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
for(int c=0;c<3;c++){
float scale = c1.z;
for(int i=0;i<9;i++)
{
uv = triangle_wave(uv+offset,scale)+triangle_wave(uv.yx,scale);
//if(uv.x > uv.y) uv *= scale;

uv.x *= -1.0;
uv = triangle_wave(uv+c1.w,scale);
scale /= scale2+col.x;
offset *= scale2;
uv.y *= -1.0;
uv = uv.yx;
//uv = uv.yx;

}
col[c] = fract((uv.x)-(uv.y));
}

fragColor = vec4(vec3(col),1.0);

}
```

### M3jSWc — Red and black rug (music) (jarble)

```glsl
vec2 triangle_wave(vec2 a){
vec2 a2 =
vec2(1.,0.5)
,
a1 = a+a2;
return abs(fract((a1)*(a2.x+a2.y))-.5);
}

float scale = 1.5;

void transform(inout vec2 uv, inout vec2 t2, inout vec3 col,inout float c1){

uv = (uv+t2)/scale;
uv = ((vec2(uv+vec2(.5,1.5))*scale)-.5)/scale;

t2 = triangle_wave(uv+.5);
uv =
t2/2.-triangle_wave(uv.yx)
//1./2.-triangle_wave(uv.yx)
;
{t2.x = (t2.x-1.); }
//{t2.x = (t2.x+1.*sign(uv.y)); }
if(uv.x>uv.y)
uv.y += 1./4.;
}

vec3 fractal(vec2 uv){
vec3 col = vec3(0.);
vec2 t2 = vec2(0.);
float c1=0.;
for(int k = 0; k < 12; k++){
transform(uv,t2,col,c1);
c1 =
max(abs(t2.y-t2.x)/2.,c1)
//max(sign(t2.x-t2.y)/2.,c1)
;
c1 =
max(1.-abs(2.*c1-1.),0.)
;
col.x =
abs(c1-col.x)/2.
;
}
return col*2.;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
float t1 = 6.;

vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv.xy += iTime/t1/12.;
if(iMouse.z>.5)
uv = uv.xy + iMouse.xy / iResolution.xy/t1;
vec3 col1 = fractal(uv);
fragColor = vec4(col1,1.0);
//fragColor = pow(fragColor ,vec4(1./1.8)); //gamma correction

}
```

### lfs3Wn — Green and gold flower rug (jarble)

```glsl
vec2 triangle_wave(vec2 a){
vec2 a2 =
vec2(1.,0.5)
,
a1 = a+a2;
return abs(fract((a1)*(a2.x+a2.y))-.5);
}

const float scale = 1.5;

void transform(inout vec2 uv, inout vec2 t2){
t2 = triangle_wave(uv+.5);
uv =
t2-triangle_wave(uv.yx)-fract(t2/2.)
;
}

vec2 rotate(vec2 v, float a) {
float s = sin(a);
float c = cos(a);
mat2 m = mat2(c, s, -s, c);
return m * v;
}

vec3 fractal(vec2 uv){
vec3 col = vec3(0.);
vec2 t2 = vec2(0.);
vec3 col1 = col;
float c1=0.;
for(int k = 0; k < 15; k++){
float warp_scale = 16.;
vec2 warp =
vec2(sin((t2.x)*warp_scale),cos((t2.y)*warp_scale))
;
uv.y -= 1./4.;

uv = (uv+t2)/scale;

uv = (fract(vec2(uv+vec2(.5,1.5))*scale)-.5)/scale;
col.x =
max(length(uv-t2-c1)/3.,col.x);

;
if(k>1)
warp = warp*warp/warp_scale;
else
warp = vec2(0);

vec2 uv_1 =
uv + warp.yx
,
t2_1=
t2 + warp.yx
;
vec3 col_1 = col;
transform(uv,t2);

transform(uv_1,t2_1);

c1 =
max(abs(uv_1.y+uv_1.x)/2.,c1)
;
c1 =
max(1.-abs(2.*c1-1.),c1/4.)
;
col.x =
max(length(uv_1-t2_1-c1)/3.,col.x)

;
col =
abs(col-(1.-(c1*col.x)));
col1 =
abs(col1*c1-col-1.).yzx
;
}
return col1;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
float t1 = 2.*8.;

vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv.xy += iTime/t1/12./2.;
if(iMouse.z>.5)
uv = uv.xy + iMouse.xy / iResolution.xy/t1;
vec3 col1 = fractal(uv);
fragColor = vec4(col1/2.,1.0);
}
```

(Commented-out alternates were dropped. See the Shadertoy page.)

### fl3GDB — Persian carpet 18 (jarble)

```glsl
//change these constants to get different patterns!
#define c2 0.0

#define c1 vec4(3.0+c2,2.5+c2,1.5,0)
//#define c1 vec4(2.0+c2,1.5+c2,1.4,0)
//#define c1 vec4(1.0,1.5,1.4,0)
//#define c1 vec4(7.0,5.0,1.4,0)
//#define c1 vec4(7.0,9.0,1.4,0)
//#define c1 vec4(5.0,5.5,1.4,0)

vec3 hash31(float p)
{
vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
p3 += dot(p3, p3.yzx+33.33);
return fract((p3.xxy+p3.yzz)*p3.zyx);
}

vec2 triangle_wave(vec2 a,float scale){
return abs(fract((a+c1.xy)*scale)-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);

vec3 col;
float t1 = 4.5/8.;

vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
if(iMouse.z>.5)
uv = uv.xy + iMouse.xy / iResolution.xy/t1;
float t2 = floor((iTime/2.+uv.x)/10.0);
vec3 random1 = (hash31(3.+t2)-.5)/12.;
vec3 random2 = (hash31(4.+t2)-.5)/12.;
vec3 random3 = (hash31(3.+t2)-vec3(.5))/1.5;

float offset = .5;
float scale2 = 1.5;
float bend = 1.;
vec3 col1 = col;
for(int c=0;c<3;c++){
float scale = c1.z;
for(int i=0;i<3;i++)
{

for(int k = 0; k < 3; k++){
uv /= -scale2;
vec2 t2 = triangle_wave(uv.yx-offset,scale);
vec2 t3 = triangle_wave(uv,scale);
uv.yx = t2/bend+t3*bend;
uv += vec2(random1[k],random2[k]);
}

scale /= 1.+(scale2)*col.x/(8.);
scale2 -= (col.x-1.)/(4.);

col[c] = abs((uv.x)-(uv.y));
col1 = abs(col-col1.yzx);

}
}

fragColor =
vec4(vec3(col*2.),1.0);
//vec4(vec3(col1*2.),1.0);

}
```

(The source has many commented-out experiments, including several "a more
interesting quilt pattern" `uv +=` lines. Those were dropped here. See the
Shadertoy page for them.)

### NtKcRG — Red and blue rug (jarble)

```glsl
vec2 triangle_wave(vec2 a){
return abs(fract((a+vec2(1.,0.5))*1.5)-.5);
}

#define triwave_(p) abs(fract(.5+p/4.0)-.5)*2.
#define triwave1_(p) (abs(fract(p/8.0)-.5)-abs(fract(p/2.0)-.5)/2.)
float t1_(vec2 c, vec2 p){
return triwave_((.5 - length( min(p=fract(p*sign(triwave1_(c*c.y))), 1.-p.yx) )));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
vec3 col = vec3(0.);
float t1 = 8.;
vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
float scale = 1.5;
vec2 t2 = vec2(0.);
for(int k = 0; k < 9; k++){
uv = (uv+t2)/scale;
t2 = -triangle_wave(uv-.5);
uv = t2-triangle_wave(uv.yx);
col = abs(vec3(uv.y-uv.x,col.yz));
if(uv.x < uv.y) {col = col.yzx;}
}
fragColor = vec4(col*2.,1.0);
}
```

(`t1_` is unused. A commented-out alternate `mainImage` follows in the source.)

### Wlyfzw — Oriental rug (jarble)

```glsl
//vec3 c1 = vec3(7.0,5.0,1.4); //change this constant to get different patterns!
//vec3 c1 = vec3(7.0,9.0,1.4);
vec3 c1 = vec3(2.0,2.5,1.4); //looks like a carpet
//vec3 c1 = vec3(1.7,1.9,1.3);

vec2 triangle_wave(vec2 a,float scale){
return abs(fract((a+c1.xy)*scale)-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
fragColor = vec4(0.0);
vec3 col;
float t1 = 4.0;
float offset = .16;
float scale2 = 1.02;
vec2 uv = (fragCoord-iResolution.xy)/iResolution.y/t1/2.0;
uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
for(int c=0;c<3;c++){
float scale = c1.z;
for(int i=0;i<6;i++)
{
uv = triangle_wave(uv+offset,scale)+triangle_wave(uv.yx,scale);
uv = triangle_wave(uv+col.xy,scale);
scale /= scale2+col.x;
offset /= scale2;
uv.y /= -1.0;
}
col[c] = fract((uv.x)-(uv.y));
}

fragColor = vec4(vec3(col),1.0);

}
```

### 7lGfWt — Funky Motherboard Carpet (leon)

```glsl
// --- Common
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }

// Dave Hoskins https://www.shadertoy.com/view/4djSRW
float hash13(vec3 p3)
{
p3 = fract(p3 * .1031);
p3 += dot(p3, p3.zyx + 31.32);
return fract((p3.x + p3.y) * p3.z);
}

vec3 hash31(float p)
{
vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
p3 += dot(p3, p3.yzx+33.33);
return fract((p3.xxy+p3.yzz)*p3.zyx);
}

// --- Image
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
vec3 color = vec3(0);

vec2 uv = fragCoord/iResolution.xy;
vec2 p = 2.*(fragCoord*2.-iResolution.xy)/iResolution.y;

float thin = .1;
float glow = .01;
float delay = 10.;

float cell = 4.0;
vec2 pp = floor(uv*cell)/cell;

float seed = hash13(vec3(pp, floor(iTime/delay))) * 196.;

vec3 rng = hash31(seed);
vec3 rng2 = hash31(seed+1096.);
float size = mix(.01, .2, rng2.z);
vec2 range = mix(vec2(.2), vec2(.8), rng.xy);
float rangeY = mix(.1, .2, rng.z);
float fallOff = mix(1.1, 1.2, rng2.x);
float count = floor(mix(4., 12., rng2.y));

float a = 1.0;
for (float index = 0.; index < count; ++index)
{
p = abs(p)-range*a;
p *= rot(3.1415/4.);
p.y = abs(p.y)-rangeY;

float dist = max(abs(p.x) + a*sin(6.28*index/count), p.y-size);

color += smoothstep(thin, 0.0, dist) * glow / dist;

a /= fallOff;
}

color = clamp(color, 0., 1.);

color *= .5 + .5 * cos(vec3(1,2,3)*5. + p.x * 10.);

color += .04/abs(sin(p.y*12.+iTime*1.));

fragColor = vec4(color,1.0);
}
```
