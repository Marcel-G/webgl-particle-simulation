precision highp float;

uniform vec4 color;
uniform vec2 worldsize;

void main() {
  vec2 center = vec2(0.5, 0.5);
  vec2 loc = gl_PointCoord.xy;

  float radius = length(loc - center);

  gl_FragColor = (radius < 0.5)
    ? color
    : vec4(0, 0, 0, 0);
}
