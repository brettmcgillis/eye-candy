float ilerp(float a, float b, float c)
{
    float t = (c-a) / (b-a);
    return t;
}

vec2 quadratic_spline(mat3x2 C, float x)
{
    x = clamp(x, 0., 1.);
    float[4] t = float[4](-1., 0., 1., 2.); // knot vector
    const int d = 2;
    mat2x2 C1 = mat2x2(
        mix(C[0], C[1], ilerp(t[0], t[0+d], x)),
        mix(C[1], C[2], ilerp(t[1], t[1+d], x))
    );
    
    vec2 C2 = (
        mix(C1[0], C1[1], ilerp(t[1], t[1+d-1], x))
    );
    
    return C2;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    if(int(fragCoord.y) > 0) {fragColor=vec4(0); return; }
    
    vec2 uv = (2. * fragCoord - iResolution.xy)/iResolution.y;
    vec2 mouse1 = (2. * abs(iMouse.xy) - iResolution.xy)/iResolution.y;
    vec2 mouse0 = (2. * abs(iMouse.zw) - iResolution.xy)/iResolution.y;
    float mouse_down = step(0.5, iMouse.z);
    float prev_mouse_down = texelFetch(iChannel1, ivec2(fragCoord), 0).a;
    
    float ps = 2. / iResolution.y;
    
    vec4 prev_state = texelFetch(iChannel0, ivec2(fragCoord), 0);
    
    if(iFrame == 0 
    || prev_mouse_down < .5
    )
    {
        prev_state = vec4(mouse1, mouse1);
        fragColor = prev_state;
        return;
    }
    
    {
        if(int(fragCoord.x) == 0)
            fragColor = vec4(mouse1, prev_state.xy);
        else
        {
            vec4 prev_neighbor_state = texelFetch(iChannel0, ivec2(fragCoord)-ivec2(1,0), 0);
            fragColor = vec4(prev_neighbor_state.zw, prev_state.xy);
        }
    }
    
}

vec2 quadraticCaseljau(vec2 a, vec2 b, vec2 c, float x)
{
    return mix(mix(a, b, x), mix(b, c, x), x);
}

float seg(vec2 a, vec2 b, vec2 p)
{
    b-=a; p-=a;
    return length(clamp(dot(p,b)/dot(b,b), 0., 1.) * b - p);
}


float brush_size = 0.06;
float brush_pressure = 0.3;


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2. * fragCoord - iResolution.xy)/iResolution.y;
    
    vec2 mouse1 = (2. * abs(iMouse.xy) - iResolution.xy)/iResolution.y;
    vec2 mouse0 = (2. * abs(iMouse.zw) - iResolution.xy)/iResolution.y;
    float mouse_down = step(0., iMouse.z);
    
    
    
    float ps = 2. / iResolution.y;
    
    vec4 prev_mouse = texelFetch(iChannel0, ivec2(0,0), 0);
    
    vec4 prev_prev_mouse = texelFetch(iChannel0, ivec2(1,0), 0);
    
    vec3 color = vec3(0);
    
    const float PI = 3.14159265;
    float hue = iTime/2.;
    vec3 brush_color = .5-.5*cos(2. * PI * (vec3(2.0, 1.0, 0.0	) *hue + vec3(0.50, 0.20, 0.25)/3.));
    
    
    float samplecount = 0.;
    for(float i = -1.; i <= 1.; i++)
    for(float j = -1.; j <= 1.; j++)
    if(abs(i) == abs(j)) continue;
    else
    {
        #if 0
        float noise = texelFetch(iChannel2, ivec2(fragCoord + vec2(i,j))%1024, 0).r * 2. -1.;
        #else
        float noise = texelFetch(iChannel3, ivec2(fragCoord + vec2(i,j))%256, 0).r * 2. -1.;
        #endif
        color += texture(iChannel1, (fragCoord + vec2(i,j) * noise * .5)/iResolution.xy).rgb;
        samplecount++;
    }
    color /= samplecount;
    
    vec2 A = prev_prev_mouse.zw;
    vec2 B = prev_prev_mouse.xy;
    vec2 C = prev_mouse.zw;

    bool demomode = length(iMouse.xy) < 10.;
    
    if(demomode)
    {
        A = vec2(cos(iTime), .5 * sin(2. *iTime)-iTime*0.075+.85);
        B = vec2(cos(iTime-0.1), .5 * sin(2. *iTime-0.1)-iTime*0.075+.85);
        C = vec2(cos(iTime-0.2), .5 * sin(2. *iTime-0.2)-iTime*0.075+.85);
        mouse_down = 0.;
    }

    vec2 a = A;
    vec2 b = B;
    vec2 c = C;
    
    float steps = 10.;
    if(mouse_down > 0.5 || demomode)
    for(float i = 0.; i < steps; i++)
    {
        float t0 = i/steps;
        float t1 = (i+1.)/steps;
        #if 0
        vec2 p0 = quadraticCaseljau(a,b,c, t0);
        vec2 p1 = quadraticCaseljau(a,b,c, t1);
        #else
        vec2 p0 = quadratic_spline(mat3x2(a,b,c), t0);
        vec2 p1 = quadratic_spline(mat3x2(a,b,c), t1);
        
        #endif
        float d = seg(p0, p1, uv);
        //float alpha = smoothstep(ps, -ps, d-brush_size);
        float alpha = smoothstep(0.02, -0.02, d-brush_size);
        vec3 noise = texture(iChannel3, a+(uv - p0)).rgb * 2. -1.;
        color += alpha * brush_color * brush_pressure * (.66+.33 * noise);
    }
    
    fragColor = vec4(color, mouse_down);
}


/*
    Interactive Watercolor Painting by chronos
    ----------------------------------------------------
    
     Watercolor diffusion simulation based on "Watercolor diffusion simple" https://www.shadertoy.com/view/lXycDc
     in turn based on "watercolor propagation"  https://www.shadertoy.com/view/mdlXW2


    I loved the look and texture of the above shaders,
    so here I re-implemented the simulation,
    added quadratic B-spline smoothened brush strokes,
    modified the rendering to be absorption based,
    animated the brush color,
    and corrected the sRGB encoding.

    I have some more fun ideas for this :)

    ----------------------------------------------------
    self link: https://www.shadertoy.com/view/lXyyDd
    ----------------------------------------------------

*/



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2. * fragCoord - iResolution.xy)/iResolution.y;
    
    vec2 mouse1 = (2. * abs(iMouse.xy) - iResolution.xy)/iResolution.y;
    vec2 mouse0 = (2. * abs(iMouse.zw) - iResolution.xy)/iResolution.y;
    float mouse_down = step(0.5, iMouse.z);
    
    float ps = 2. / iResolution.y;
        
    vec3 color =  texelFetch(iChannel1, ivec2(fragCoord), 0).rgb;

    color = exp(-color);

    fragColor = vec4(pow(color, vec3(1./2.2)), 1);
}
