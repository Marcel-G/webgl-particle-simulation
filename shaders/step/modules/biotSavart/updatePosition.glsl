uniform float frameInterval;

void updatePosition(inout vec2 p, inout vec2 v) {
  p += v * 0.3 * frameInterval;
}

#pragma glslify: export(updatePosition)

