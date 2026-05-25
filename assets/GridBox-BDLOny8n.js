import{r as d,aa as x,B as c,j as a,V as g,n as v}from"./index-ChdCNEyj.js";import{G as m}from"./gridMaterial-C-JJuOmC.js";const f=2e3,u=100,P=`
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,b=`
  uniform vec3 bgColor;
  uniform vec3 lineColor;
  uniform float gridSize;
  uniform float lineWidth;
  varying vec3 vLocalPos;

  void main() {
    // Determine dominant face axis so each face gets its own 2D grid UV.
    vec3 absP = abs(vLocalPos);
    vec2 gridUV;
    if (absP.x >= absP.y && absP.x >= absP.z) {
      gridUV = vLocalPos.yz;
    } else if (absP.y >= absP.x && absP.y >= absP.z) {
      gridUV = vLocalPos.xz;
    } else {
      gridUV = vLocalPos.xy;
    }

    // Draw grid lines at every gridSize world units.
    vec2 f = fract(gridUV / gridSize);
    float line = max(step(f.x, lineWidth), step(f.y, lineWidth));

    gl_FragColor = vec4(mix(bgColor, lineColor, line), 1.0);
  }
`;function t(o){const r=parseInt(o.slice(1,3),16)/255,s=parseInt(o.slice(3,5),16)/255,e=parseInt(o.slice(5,7),16)/255;return new g(r,s,e)}function G({bgColor:o="#3a4a5c",lineColor:r="#1a2330",lineWidth:s=.025,size:e=f,gridSize:i=u}){const n=e/2-e*.1,l=d.useMemo(()=>new x({vertexShader:P,fragmentShader:b,uniforms:{bgColor:{value:t(o)},lineColor:{value:t(r)},gridSize:{value:i},lineWidth:{value:s}},side:c}),[o,r,s,i]);return a.jsx("mesh",{position:[0,n,0],material:l,children:a.jsx("boxGeometry",{args:[e,e,e]})})}const U=2e3,p=100;function h({bgColor:o="#3a4a5c",lineColor:r="#1a2330",lineWidth:s=.025,size:e=U,gridSize:i=p}){const n=e/2-e*.1;return a.jsxs("mesh",{position:[0,n,0],children:[a.jsx("boxGeometry",{args:[e,e,e]}),a.jsx(m,{bgColor:o,lineColor:r,lineWidth:s,gridSize:i,roughness:1,metalness:0,side:c})]})}function S(o){return v(e=>e.gl)?.isWebGPURenderer===!0?a.jsx(h,{...o}):a.jsx(G,{...o})}export{S as G};
