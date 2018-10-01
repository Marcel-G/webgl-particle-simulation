precision highp float;

#define MAX_STATE_SIZE 100

uniform sampler2D positions;
uniform sampler2D velocities;
uniform sampler2D weights;
uniform vec2 statesize;
uniform vec2 worldsize;
uniform int derivative;
uniform float frameInterval;
uniform vec2 scale;
varying vec2 index;

const float BASE = 255.0;
const float OFFSET = BASE * BASE / 2.0;

#pragma glslify: encode = require('../utils/encode', BASE=BASE, OFFSET=OFFSET)

float scalex() {
  return scale.x;
}
float scaley() {
  return scale.y;
}

#pragma glslify: getPositionAt = require('../utils/decodeAt', SAMPLE=positions, GETSCALE=scalex)
#pragma glslify: getVelocityAt = require('../utils/decodeAt', SAMPLE=velocities, GETSCALE=scaley)
#pragma glslify: getWeightAt = require('../utils/decodeAt', SAMPLE=weights, GETSCALE=scalex)

#pragma glslify: updatePosition = require('./modules/biotSavart/updatePosition', frameInterval=frameInterval)
#pragma glslify: updateVelocity = require('./modules/biotSavart/updateVelocity', scalex=scalex, scaley=scaley positions=positions, weights=weights, statesize=statesize, worldsize=worldsize, MAX_STATE_SIZE=MAX_STATE_SIZE)

void main() {
  vec2 currentPosition = getPositionAt(index);
  vec2 currentVelocity = getVelocityAt(index);
  vec2 result;
  float s;
  if (derivative == 0) {
    // updateVelocity(currentPosition, currentVelocity);
    // result = currentVelocity;
    s = scale.y;
  } else if (derivative == 1) {
    // updatePosition(currentPosition, currentVelocity);
    // result = currentPosition;
    s = scale.x;
  }
  gl_FragColor = vec4(encode(result.x, s), encode(result.y, s));
}
