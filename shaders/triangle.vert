precision mediump float;

attribute vec2 position;
varying vec2 vUv;

void main() {
  gl_Position = vec4(position, 1.0, 1.0);
}
