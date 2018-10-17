// Particle Draw Fragment Shader

precision highp float;

uniform vec4 color;
uniform vec2 screenSize;
varying vec2 currentVelocity;

void main() {
  gl_FragColor = vec4(currentVelocity, 1.0, 1.0);
}
