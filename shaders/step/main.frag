precision highp float;

#define MAX_STATE_SIZE 100

uniform sampler2D positions;
uniform sampler2D velocities;
uniform int derivative;
uniform vec2 scale;
varying vec2 index;
varying vec2 random;

#pragma glslify: encode = require('../utils/encode')
#pragma glslify: decode = require('../utils/decode')

#pragma glslify: updatePosition = require('./modules/biotSavart/updatePosition')
#pragma glslify: updateVelocity = require('./modules/biotSavart/updateVelocity',positions=positions, MAX_STATE_SIZE=MAX_STATE_SIZE, scale=scale)

void main() {
  vec4 psample = texture2D(positions, index);
  vec4 vsample = texture2D(velocities, index);
  vec2 p = vec2(decode(psample.rg, scale.x), decode(psample.ba, scale.x));
  vec2 v = vec2(decode(vsample.rg, scale.y), decode(vsample.ba, scale.y));
  vec2 result;
  float s;
  if (derivative == 0) {
    updateVelocity(p, v);
    result = v;
    s = scale.y;
  } else {
    updatePosition(p, v);
    result = p;
    s = scale.x;
  }
  gl_FragColor = vec4(encode(result.x, s), encode(result.y, s));
}
