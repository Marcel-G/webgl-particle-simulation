// Particle Logic Fragment Shader

precision highp float;

#define MAX_STATE_SIZE 100

uniform sampler2D particleState;
uniform sampler2D particleWeights;
uniform float stateSize;
uniform vec2 screenSize;
uniform float frameInterval;
varying vec2 vUv;

#define frameInterval 60.0

#pragma glslify: updatePosition = require('./modules/biotSavart/updatePosition', frameInterval=frameInterval)
#pragma glslify: updateVelocity = require('./modules/biotSavart/updateVelocity', particleState=particleState, stateSize=stateSize, particleWeights=particleWeights, screenSize=screenSize, MAX_STATE_SIZE=MAX_STATE_SIZE)

void main() {
  vec2 uv = gl_FragCoord.xy / stateSize;

  vec4 particleStateValues = texture2D(particleState, uv);
  vec2 currentPosition = particleStateValues.xy;
  vec2 currentVelocity = particleStateValues.zw;

  updateVelocity(currentPosition, currentVelocity);

  updatePosition(currentPosition, currentVelocity);

  gl_FragColor = vec4(currentPosition, currentVelocity);
}
