// Particle Draw Vertex Shader

precision highp float;

uniform sampler2D trailState;
uniform float stateSize;
uniform vec2 screenSize;

attribute vec2 position;
varying vec2 currentVelocity;

void main() {
    vec4 trailStateValues = texture2D(trailState, position);
    vec2 currentPosition = trailStateValues.xy;
    currentVelocity = trailStateValues.zw;

    gl_Position = vec4(currentPosition, 1.0, 1.0);
    gl_PointSize = 10.0;
}
