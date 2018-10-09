precision highp float;

uniform sampler2D particleState;
uniform float stateSize;
uniform vec2 screenSize;

attribute vec2 position;
varying vec2 vUv;

void main() {
    vec4 particleStateValues = texture2D(particleState, position / stateSize);
    vec2 currentPosition = particleStateValues.xy;
    vec2 currentVelocity = particleStateValues.zw;

    gl_Position = vec4(currentPosition, 1.0, 1.0);
    gl_PointSize = 10.0;
}
