precision highp float;

#define MAX_STATE_SIZE 100

uniform sampler2D positions;
uniform sampler2D velocities;
uniform sampler2D weights;
uniform int derivative;
uniform vec2 scale;
varying vec2 index;
varying vec2 random;

const float BASE = 255.0;
const float OFFSET = BASE * BASE / 2.0;

#pragma glslify: encode = require('../utils/encode', BASE=BASE, OFFSET=OFFSET)
#pragma glslify: decode = require('../utils/decode', BASE=BASE, OFFSET=OFFSET)

vec2 decodeAt(vec2 atIndex, sampler2D sample, float s) {
  vec4 texture = texture2D(positions, atIndex);
  return vec2(decode(texture.rg, s), decode(texture.ba, s));
}

vec2 getPositionAt(vec2 atIndex) {
  return decodeAt(atIndex, positions, scale.x);
}

vec2 getVelocityAt(vec2 atIndex) {
  return decodeAt(atIndex, velocities, scale.y);
}

float getWeightAt(vec2 atIndex) {
  return decodeAt(atIndex, weights, scale.y).x;
}

#pragma glslify: updatePosition = require('./modules/biotSavart/updatePosition')
#pragma glslify: updateVelocity = require('./modules/biotSavart/updateVelocity', getPositionAt=getPositionAt, getWeightAt=getWeightAt, MAX_STATE_SIZE=MAX_STATE_SIZE)

void main() {
  vec2 currentPosition = getPositionAt(index);
  vec2 currentVelocity = getVelocityAt(index);
  vec2 result;
  float s;
  if (derivative == 0) {
    updateVelocity(currentPosition, currentVelocity);
    result = currentVelocity;
    s = scale.y;
  } else {
    updatePosition(currentPosition, currentVelocity);
    result = currentPosition;
    s = scale.x;
  }
  gl_FragColor = vec4(encode(result.x, s), encode(result.y, s));
}
