// Common
// 3D utilities
#define N 7.
vec2 R;
// [ [0,R/N]; [0,N*N] ] < -- > [0,R]
vec2 d2 (vec3 U) {
U = clamp(U,vec3(1),vec3(R/N,N*N));
return U.xy+vec2(mod(U.z,N),floor(U.z/N))*R/N;
}
vec3 d3 (vec2 u) {
vec2 o = floor(u/R*N);
return vec3(mod(u,R/N),o.x+o.y*N);
}
vec4 s3d (sampler2D T,vec3 U) {
vec3 U0 = vec3 (U.xy,floor(U.z)),
U1 = vec3 (U.xy, ceil(U.z));
vec4 o = mix(
texture(T,d2(U0)/R),
texture(T,d2(U1)/R),
fract(U.z)
);
if (U.x<1.||U.y<1.||U.z<1.) o.xyz\*=0.;
return o;
}
vec4 s3d1 (sampler2D T, vec3 U) {
U=U-s3d(T,U).xyz;
vec4 s = s3d(T,U);
return s;
}
float dist (vec3 U, vec4 A) {
return length(U-A.xyz)-A.w;
}

// Buffer A

//Fluid Velocity
#define s 0.16666666666
void X (inout vec4 Q, vec4 me, vec4 me1, vec3 o, vec3 r) {
vec4 n = s3d1(iChannel0,o+r);
Q += s*vec4(
r*(n.w-me.w), // pressure force
dot(r,n.xyz-me.xyz)+n.w-me.w // pressure calculation
);
}
void mainImage( out vec4 Q, in vec2 U )
{ R = iResolution.xy;
vec3 o = d3(U);
Q = s3d1(iChannel0,o);
vec4 me = Q, me1 = s3d1(iChannel2,o);
X(Q,me,me1,o, vec3(1,0,0));
X(Q,me,me1,o, vec3(0,1,0));
X(Q,me,me1,o, vec3(0,0,1));
X(Q,me,me1,o,-vec3(1,0,0));
X(Q,me,me1,o,-vec3(0,1,0));
X(Q,me,me1,o,-vec3(0,0,1));

if (o.x < 1. || R.x/N-o.x < 1.)Q.xyz*=0.;
if (o.y < 1. || R.y/N-o.y < 1.)Q.xyz*=0.;
if (o.z < .8 || N*N - o.z < 1.1)Q.xyz*=0.;
float i = float (iFrame)/60.;
Q.xyz = mix(Q.xyz,0.5*vec3(cos(.4*i),sin(.4*i),.5*cos(.8*i)),smoothstep(0.,-.1,length(o-0.5*vec3(R/N,N*N)) - max(2.,0.01*R.x/N)));
if (iFrame < 1) Q = vec4(0);
}

// Buffer B
// Fluid Color
void mainImage( out vec4 Q, in vec2 U )
{ R = iResolution.xy;
vec3 o = d3(U);
Q = 0.9997\*s3d(iChannel1,o-s3d(iChannel0,o).xyz);

Q.xyz = mix(Q.xyz,0.5+0.5*sin(.2*iTime*vec3(1,2,3)),smoothstep(0.,-.01,length(o-0.5*vec3(R/N,N*N)) - max(2.,0.01*R.x/N)));

    if (iFrame < 1) Q = vec4(0);

}

// Buffer C
//Fluid Velocity
#define s 0.16666666666
void X (inout vec4 Q, vec4 me, vec4 me1, vec3 o, vec3 r) {
vec4 n = s3d1(iChannel0,o+r);
Q += s*vec4(
r*(n.w-me.w), // pressure force
dot(r,n.xyz-me.xyz)+n.w-me.w // pressure calculation
);
}
void mainImage( out vec4 Q, in vec2 U )
{ R = iResolution.xy;
vec3 o = d3(U);
Q = s3d1(iChannel0,o);
vec4 me = Q, me1 = s3d1(iChannel2,o);
X(Q,me,me1,o, vec3(1,0,0));
X(Q,me,me1,o, vec3(0,1,0));
X(Q,me,me1,o, vec3(0,0,1));
X(Q,me,me1,o,-vec3(1,0,0));
X(Q,me,me1,o,-vec3(0,1,0));
X(Q,me,me1,o,-vec3(0,0,1));

if (o.x < 1. || R.x/N-o.x < 1.)Q.xyz*=0.;
if (o.y < 1. || R.y/N-o.y < 1.)Q.xyz*=0.;
if (o.z < .8 || N*N - o.z < 1.1)Q.xyz*=0.;
float i = float (iFrame)/60.;
Q.xyz = mix(Q.xyz,0.5*vec3(cos(.4*i),sin(.4*i),.5*cos(.8*i)),smoothstep(0.,-.1,length(o-0.5*vec3(R/N,N*N)) - max(2.,0.01*R.x/N)));
if (iFrame < 1) Q = vec4(0);
}

// Buffer D
// Fluid Color
void mainImage( out vec4 Q, in vec2 U )
{ R = iResolution.xy;
vec3 o = d3(U);
Q = 0.9995\*s3d(iChannel1,o-s3d(iChannel0,o).xyz);

Q.xyz = mix(Q.xyz,0.5+0.5*sin(.2*iTime*vec3(1,2,3)),smoothstep(0.,-.01,length(o-0.5*vec3(R/N,N*N)) - max(2.,0.01*R.x/N)));

    if (iFrame < 1) Q = vec4(0);

}

// Image
//Rendering
mat2 ro (float a) {
float s = sin(a),c = cos(a);
return mat2(c,-s,s,c);
}
void mainImage( out vec4 Q, in vec2 U )
{ R = iResolution.xy;

vec3 p = vec3(0,0,-.6*R.x/N);
vec3 d = normalize(vec3(3.*(U-0.5*R)/R.y,2));
if (iMouse.z>0.) {
p.xz *= ro(6.2*iMouse.x/R.x);
d.xz *= ro(6.2*iMouse.x/R.x);
p.yz *= ro(6.2*iMouse.y/R.y);
d.yz *= ro(6.2*iMouse.y/R.y);
} else {
p.xz *= ro(3.1+.1*iTime);
d.xz *= ro(3.1+.1*iTime);
}
Q = vec4(0);
for (int i = 0; i < 4; i++) {
vec3 o = abs(p)-0.5*vec3(R/N,N*N);
p+= d*max(o.x,max(o.y,o.z));
}
p += 2.*d*fract(iTime*sin(dot(U,U)));
p+=0.5*vec3(R/N,N*N);
for (int i = 0; i < 40; i++) {
vec4 a = s3d(iChannel1,p);
if (p.x < 2. || R.x/N-p.x < 2. ||
p.y < 2. || R.y/N-p.y < 2. ||
p.z < .8 || N*N - p.z < 1.1) a*=0.;
p += d*max(.1,3.*exp(-100.*length(a.xyz)));
Q += a;
}
Q = atan(4._Q)_.7;
Q += exp(-10.*length(Q.xyz))*atan(10.\*texture(iChannel1,U/R));

}
