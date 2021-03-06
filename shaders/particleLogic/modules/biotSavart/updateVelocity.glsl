#define M_PI 3.1415926535897932384626433832795

vec2 calculateBackgroundForce(vec2 currentPosition) {
  vec2 center = vec2(0.0);
  float distanceFromCenter = distance(currentPosition, center) / 2.0;
  float radialForce = (tan(M_PI * distanceFromCenter + M_PI / 2.0) / 2.0) * (distanceFromCenter + 0.3) + 0.2;
  return normalize(center - currentPosition) * min(radialForce, 2.0);
}

vec2 calculateBiotForce(vec2 currentPosition) {
  vec2 nv = vec2(0.0, 0.0);

  for (int vortx = 0; vortx < MAX_STATE_SIZE; vortx++) {
    if (vortx >= int(stateSize)){ break; }

    for (int vorty = 0; vorty < MAX_STATE_SIZE; vorty++) {
      if (vorty >= int(stateSize)){ break; }

      vec2 referenceVUv = vec2(vortx, vorty) / stateSize; // set denominator to static 10 for glitchy effect
      vec4 particleStateValues = texture2D(particleState, referenceVUv);
      vec2 referencePosition = particleStateValues.xy;

      float pointDistance = abs(distance(currentPosition, referencePosition));

      // if (pointDistance > screenSize.x / 4.0) continue;

      if (referencePosition != currentPosition) { // don't apply force to self
        float weight = texture2D(particleWeights, referenceVUv).x;
        for (int x = -1; x <= 1; x++) {
          for (int y = -1; y <= 1; y++) {
            float dx = referencePosition.x - (currentPosition.x + 2.0 * float(x));
            float dy = referencePosition.y - (currentPosition.y + 2.0 * float(y));
            float r2 = (dx * dx) + (dy * dy);
            float k = (weight * 2.0) / r2;
            nv += k * vec2(-dy, dx);
          }
        }
      }
    }
  }

  return nv / (stateSize * stateSize);
}

void updateVelocity(vec2 currentPosition, inout vec2 currentVelocity) {
  vec2 biotForce = 0.3 * calculateBiotForce(currentPosition);
  vec2 radialForce = 0.3 * calculateBackgroundForce(currentPosition);
  vec2 inertia = 0.9 * currentVelocity;

  currentVelocity = biotForce + radialForce + inertia;
}

#pragma glslify: export(updateVelocity)
