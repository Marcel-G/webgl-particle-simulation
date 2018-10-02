#pragma glslify: decode = require('../utils/decode')

vec2 decodeAt(vec2 atIndex) {
  float scale = GETSCALE();
  vec4 texture = texture2D(SAMPLE, atIndex);
  return vec2(decode(texture.rg, scale), decode(texture.ba, scale));
}

#pragma glslify: export(decodeAt)
