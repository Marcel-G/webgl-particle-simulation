precision highp float;

attribute vec2 quad;
varying vec2 index;
varying vec2 position;

void main() {
  index = (quad + 1.0) / 2.0;
  position = quad;
  gl_Position = vec4(quad, 0, 1);
}
