void updatePosition(inout vec2 currentPosition, vec2 currentVelocity) {
  currentPosition += currentVelocity * 0.7 * (1.0 / frameInterval);
}

#pragma glslify: export(updatePosition)

