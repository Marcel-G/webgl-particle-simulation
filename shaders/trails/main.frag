precision highp float;

uniform sampler2D particles;
uniform sampler2D trails;
varying vec2 index;
varying vec2 position;

void main() {
  vec4 color = texture2D(trails, index) + texture2D(particles, index);
  gl_FragColor = color - 0.01;
}
