#define M_PI 3.1415926535897932384626433832795

#pragma glslify: decode = require('../../../utils/decode')

uniform vec2 statesize;
uniform vec2 worldsize;

vec2 calculateBackgroundForce(vec2 currentPosition) {
  vec2 center = worldsize / 2.0;
  float distanceFromCenter = distance(currentPosition, center) / max(worldsize.x, worldsize.y);
  float radialForce = (tan(M_PI * distanceFromCenter + M_PI / 2.0) / 2.0) * (distanceFromCenter + 0.1) + 0.2;
  return normalize(center - currentPosition) * min(radialForce, 2.0);
}

vec2 calculateBiotForce(vec2 currentPosition) {
  vec2 nv = vec2(0.0, 0.0);

  for (int vortx = 0; vortx < MAX_STATE_SIZE; vortx++) {
    for (int vorty = 0; vorty < MAX_STATE_SIZE; vorty++) {
      vec2 referenceIndex = vec2(vortx, vorty) / statesize.x; // set denominator to static 10 for glitchy effect
      vec2 referencePosition = getPositionAt(referenceIndex);

      float pointDistance = abs(distance(currentPosition, referencePosition));

      if (pointDistance > worldsize.x / 4.0) continue;

      if (referencePosition != currentPosition) { // don't apply force to self
        float weight = getWeightAt(referenceIndex);
        for (int x = -1; x <= 1; x++) {
          for (int y = -1; y <= 1; y++) {
            float dx = referencePosition.x - (currentPosition.x +  worldsize.x * float(x));
            float dy = referencePosition.y - (currentPosition.y +  worldsize.y * float(y));
            float r2 = (dx * dx) + (dy * dy);
            float k = (weight * worldsize.x) / r2;
            nv += k * vec2(-dy, dx);
          }
        }
      }
      if (vorty >= int(statesize.y)){ break; }
    }
    if (vortx >= int(statesize.x)){ break; }
  }

  return nv / (statesize.x * statesize.y);
}

void updateVelocity(vec2 currentPosition, inout vec2 currentVelocity) {
  vec2 biotForce = 0.5 * calculateBiotForce(currentPosition);
  vec2 inertia = 0.1 * currentVelocity;
  vec2 radialForce = 0.4 * calculateBackgroundForce(currentPosition);

  currentVelocity = min(inertia + biotForce + radialForce, 1.0);
}

#pragma glslify: export(updateVelocity)
