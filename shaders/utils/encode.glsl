vec2 encode(float value, float scale) {
  value = value * scale + OFFSET;
  float x = mod(value, BASE);
  float y = floor(value / BASE);
  return vec2(x, y) / BASE;
}

#pragma glslify: export(encode)
