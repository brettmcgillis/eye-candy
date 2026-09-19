# // Petri Dish

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- A non-tiled, expansive reaction-diffusion field driving a sand bed inside TheSpeedOfLightning's studio, grown/cull-mapped instead of stamped by a lightning strike.

## // TODO:

- [ ] add a 4-way symmetry physarum mode

## // Presets

## // Features

## // Interactivity

## // Bugs

## // Examples

```glsl

//common


#define R iResolution.xy
#define dt iTimeDelta

#define A(U) texture(iChannel0, (U)/R)
#define B(U) texture(iChannel1, (U)/R)
#define C(U) texture(iChannel2, (U)/R)
#define D(U) texture(iChannel3, (U)/R)

#define pi 3.141592653589793

#define twopi (pi*2.)


float blur_rate = 28.;
float decay_rate = 0.97;
float deposit_rate = 12.;

float sensor_angle = pi * 0.2;
float sensor_distance = 10.;

float turn_angle = pi * 0.005;
float wander_angle = pi * 0.01;
float speed = 80.;

float spawn_distance = 10.;
float spawn_threshold = 0.5;
float spawn_mix = 0.;

float show_particles = 0.1;

float rand(float co) { return fract(sin(co*(91.3458)) * 47453.5453); }
float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
float rand(vec3 co){ return rand(co.xy+rand(co.z)); }

// distance from point p to the nearest point on the line a->b
float line (vec2 p, vec2 a, vec2 b) {
    // position on line a+tb
    float t = dot(p-a,b-a)/dot(b-a,b-a);
    // clamp to line bounds:
    t = clamp(t,0.,1.);
    // nearest point:
    vec2 n = a + t*(b-a);
    // distance to that point:
	return length(p-n);
}

mat2 rotate_mat(float a) {
	float s = sin(a);
	float c = cos(a);
	return mat2(c, s, -s, c);
}

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}


//buffer a
// Trails

vec4 init(in vec2 U) {
    vec2 uv = U/R - 0.5;
    return vec4(length(uv) < 0.3 ? 0.5 : 0.);

    // manhattan:
    float g = 100.;
    vec2 q = g * (floor(U/g)+0.5);
    vec2 rel = 2.*(U-q)/g;
    //float dist = length(rel);
    float dist = max(abs(rel.x), abs(rel.y));
    return vec4(smoothstep(0.9, 1., dist));
}

void mainImage( out vec4 OUT, in vec2 U ) {

    vec4 c = A(U);
    OUT = c;
    // blur:
    /*
    vec4 sum = vec4(0.);
    for (float y=-1.; y<=1.; y++) {
        for (float x=-1.;x<=1.;x++) {
            sum += A(U+vec2(x,y));
        }
    }
    vec4 avg = sum/ 9.;
    */
    vec4 n = A(U+vec2(0,1));
    vec4 s = A(U+vec2(0,-1));
    vec4 e = A(U+vec2(1,0));
    vec4 w = A(U+vec2(-1,0));
    vec4 avg = 0.25*(n+s+e+w);

    OUT = mix(c, avg, blur_rate * dt);

    // decay:
    OUT *= decay_rate;

    // find nearest particle:
    vec4 b = B(U);
    float dist = length(U-b.xy);
    // deposit:
    OUT += vec4(deposit_rate * dt * exp(-dist*dist));

    if (iFrame == 0) OUT = init(U);
}
//buffer b
// particles
// .xy is pos, in pixels
// .z is direction

vec4 getfield(in vec2 U) {
    return mix(A(U), C(U), 0.95);
}

vec4 init(in vec2 U) {

    // grid:
    float g = 30.;
    U = g*floor(U/g);
    float a = rand(U/R);
    //return vec4(U, a, 1.);

    return vec4(R/2., a, 1.);
}

void swap (inout vec4 Q, vec2 U, vec2 r) {
    // Q is our current estimated nearest particle
    // n is the particle at a pixel nearby
	vec4 n = B(U+r);
    // if n is closer to our pixel coordinate, pick that one instead (via Q=n)
    if (length(U-n.xy) < length(U-Q.xy)) Q = n;
}

void mainImage( out vec4 OUT, in vec2 U ) {

    // FIND NEAREST PARTICLE
    vec4 P = B(U);

    // in each axis consider a couple of steps:
    // if particle.xy there is actually closer to our pixel, use that particle instead
    if (true) {
        for (int y=-2; y<=2; y++) {
            for (int x=-2; x<2; x++) {
                vec4 n = B(U+vec2(x, y));
                if (length(U-n.xy) < length(U-P.xy)) P = n;
            }
        }
    } else {
        // cheaper but less accurate version:
        swap(P,U,vec2(1,0));
        swap(P,U,vec2(0,1));
        swap(P,U,vec2(-1,0));
        swap(P,U,vec2(0,-1));
        swap(P,U,vec2(2,2));
        swap(P,U,vec2(2,-2));
        swap(P,U,vec2(-2,2));
        swap(P,U,vec2(-2,-2));
    }


    vec4 a = A(P.xy);

    float dist = length(U - P.xy);




    //if (spawn_mix)
    // randomize direction if particle is too far away
    if (dist > spawn_distance && a.r > spawn_threshold) {
        //P.xy = mix(P.xy, U, spawn_mix);
        P.z = rand(P.xy);
    }


    //P.xy = mix(P.xy, U, spawn_mix);

    // now we have our nearest particle
    // get direction matrix:
    mat2 rot = rotate_mat(twopi * P.z);

    //P.z = mod(P.z - 0.01, 1.);


    if (true) {

        // this could all be precomputed:
        float sd = sensor_distance * a.x*a.x;
        mat2 sense_rot = rotate_mat(sensor_angle);
        vec2 s1 = vec2(sd, 0.);
        vec2 s2 = sense_rot * s1;
        vec2 s0 = s1 * sense_rot;

        // traslate & rotate by particle into world space:
        s0 = P.xy + rot*s0;
        s1 = P.xy + rot*s1;
        s2 = P.xy + rot*s2;

        // read field at sensor:
        float f0 = getfield(s0).x;
        float f1 = getfield(s1).x;
        float f2 = getfield(s2).x;

        if (true) {
            // Jeff Jones version
            if (f0 > f2 && f0 > f1) {
                // turn left:
                P.z = mod(P.z - turn_angle, 1.);
            } else if (f2 > f0 && f2 > f1) {
                // turn right:
                P.z = mod(P.z + turn_angle, 1.);
            } else if (f0 > f1 && f2 > f1) {
                // turn randomly
                //wander
                P.z = mod(P.z + wander_angle*(rand(P.xy)-0.5), 1.);
            } else {
                // no turn
            }
        }

    }

    // move it:
    rot = rotate_mat(twopi * P.z);
    P.xy += (rot * vec2(speed*dt*a.r, 0.));

    // clamp at borders:
    //P.xy = clamp(P.xy, vec2(0.5), vec2(R-0.5));

    OUT = P;

    if (iFrame == 0) OUT = init(U);

    if (U.x < R.x/2.+1. && U.x > R.x/2.-1. && U.y < R.y/2.+1. && U.y > R.y/2.-1.) {
        OUT = vec4(R/2., rand(iTime), 1.);
    }
}


//image
void mainImage( out vec4 OUT, in vec2 U ) {

    vec4 a = A(U);
    vec4 b = B(U);

    OUT = a;

    // particles
    //OUT = vec4(b.xy/R, b.z, 1.);
    //OUT = vec4(hsl2rgb(vec3(b.z, 0.5, 0.5)), 1.);

    float dist = length(U - b.xy);

    OUT = mix(OUT, vec4(exp(-dist)), show_particles);

    //OUT = vec4(dist * 0.01);

}
```
