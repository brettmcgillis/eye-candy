// React||Diffuse — Hadyn, https://www.shadertoy.com/view/Wt23W1
//
// Textbook Gray-Scott, and deliberately NOT the solver in the PetriDish scene:
// that one advects a field along its own blurred gradient, which is a
// different algorithm with a different look. This is the one being ported.
//
// Buffers A, B, C and D all run ReactAndDiffuse on the previous one, so a frame
// is four substeps. Only A seeds: the reference injects V under a doodler that
// follows the mouse, or a lissajous when the mouse is up. Here the scene's own
// emitting particles are the doodler, which is the whole point of the mode —
// light leaves a trace and the trace grows into something that occludes it.
//
// Image pass, i.e. how V becomes a mask:
//   float value = texture(iChannel0, uv).y;
//   value = smoothstep(0.1, 0.2, value);

//////////////////////////////// Common ////////////////////////////////

const vec2 DiffusionRate = vec2(1.0, 0.5);
const float FeedRate = .055;
const float KillRate = .062;
const float Step = 40.0;
const float DoodleRate = 2.0;

void ComputeLaplacian(vec2 uv, sampler2D sampler, vec2 resolution, out vec2 laplacian)
{
    vec2 texelSize = vec2(1.0)/resolution;
    laplacian =  texture(sampler, uv + vec2(-texelSize.x, texelSize.y)).xy * 0.05;
    laplacian += texture(sampler, uv + vec2(texelSize.x, 	texelSize.y)).xy * 0.05;
    laplacian += texture(sampler, uv + vec2(-texelSize.x, -texelSize.y)).xy * 0.05;
    laplacian += texture(sampler, uv + vec2(texelSize.x, 	-texelSize.y)).xy * 0.05;
    laplacian += texture(sampler, uv + vec2(-texelSize.x, 0)).xy * 0.2;
    laplacian += texture(sampler, uv + vec2(texelSize.x, 	0)).xy * 0.2;
    laplacian += texture(sampler, uv + vec2(0, texelSize.y)).xy * 0.2;
    laplacian += texture(sampler, uv + vec2(0, -texelSize.y)).xy * 0.2;
    laplacian -=  texture(sampler, uv).xy;
}

void ReactAndDiffuse(vec2 fragCoord, sampler2D sampler, vec2 resolution, float timeDelta, out vec4 fragColor)
{
    vec2 uv = fragCoord/resolution;
    vec2 laplacian;
    ComputeLaplacian(uv, sampler, resolution, laplacian);

    vec2 current = texture(sampler, uv).xy;

    float feedRate = FeedRate;
    float killRate = KillRate;
    // The x ramp is what gives the frame several regimes at once — spots on one
    // side, stripes on the other — instead of one uniform pattern everywhere.
    feedRate = FeedRate + mix(-1.0, 1.0, uv.x)*0.04;

    vec2 reaction;
    reaction.x = - current.x * current.y * current.y + feedRate * (1.0 - current.x);
    reaction.y = current.x * current.y * current.y - (feedRate + killRate) * current.y;

    fragColor.xy = current + (DiffusionRate * laplacian + reaction) * Step * timeDelta;
    fragColor.x = clamp(fragColor.x, 0.0, 1.0);
    fragColor.y = clamp(fragColor.y, 0.0, 1.0);

    fragColor.zw = vec2(0.0, 1.0);
}

//////////////////////////////// Buffer A ////////////////////////////////
// ReactAndDiffuse, then the seed:
//   fragColor.y += clamp(1.0 - length(fragCoord - doodlePosition)/(0.035*iResolution.y), 0.0, 1.0);
