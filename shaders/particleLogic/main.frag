precision highp float;

#define MAX_STATE_SIZE 50

uniform sampler2D particleState;
uniform vec2 stateSize;
uniform vec2 screenSize;
uniform float frameInterval;
varying vec2 vUv;

#define frameInterval 40.0

#pragma glslify: updatePosition = require('./modules/biotSavart/updatePosition', frameInterval=frameInterval)
#pragma glslify: updateVelocity = require('./modules/biotSavart/updateVelocity', particleState=particleState, stateSize=stateSize, screenSize=screenSize, MAX_STATE_SIZE=MAX_STATE_SIZE)

void main() {
  vec4 particleStateValues = texture2D(particleState, vUv);
  vec2 currentPosition = particleStateValues.xy;
  vec2 currentVelocity = particleStateValues.zw;

  updateVelocity(currentPosition, currentVelocity);

  updatePosition(currentPosition, currentVelocity);

  gl_FragColor = vec4(currentPosition, currentVelocity);
}
