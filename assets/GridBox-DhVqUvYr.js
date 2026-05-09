import{r as l,aI as v,aj as d,j as s,a7 as g}from"./index-fWJAS7dd.js";const f=2e3,m=100,x=`
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,P=`
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
`;function n(e){const a=parseInt(e.slice(1,3),16)/255,i=parseInt(e.slice(3,5),16)/255,o=parseInt(e.slice(5,7),16)/255;return new g(a,i,o)}function b({bgColor:e="#3a4a5c",lineColor:a="#1a2330",lineWidth:i=.025,size:o=f,gridSize:r=m}){const t=o/2-o*.1,c=l.useMemo(()=>new v({vertexShader:x,fragmentShader:P,uniforms:{bgColor:{value:n(e)},lineColor:{value:n(a)},gridSize:{value:r},lineWidth:{value:i}},side:d}),[e,a,i,r]);return s.jsx("mesh",{position:[0,t,0],material:c,children:s.jsx("boxGeometry",{args:[o,o,o]})})}export{b as G};
