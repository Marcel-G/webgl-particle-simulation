// Particle Draw Fragment Shader

precision highp float;

uniform vec4 color;
uniform vec2 screenSize;
varying float weight;

void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, weight);
}
