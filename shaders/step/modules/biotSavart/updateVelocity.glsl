#define M_PI 3.1415926535897932384626433832795

#pragma glslify: decode = require('../../../utils/decode')

uniform vec2 statesize;
uniform vec2 worldsize;
uniform sampler2D weights;

void updateVelocity(inout vec2 p, inout vec2 v) {
  vec2 nv = vec2(0.0, 0.0);

  for (int vortx = 0; vortx < MAX_STATE_SIZE; vortx++) {
    for (int vorty = 0; vorty < MAX_STATE_SIZE; vorty++) {
      vec2 cindex = vec2(vortx, vorty) / statesize.x; // set denominator to static 10 for glitchy effect
      vec4 psample = texture2D(positions, cindex);
      vec2 pv = vec2(decode(psample.rg, scale.x), decode(psample.ba, scale.x));

      float pointDistance = abs(distance(p, pv));

      if (pointDistance > worldsize.x / 4.0) continue;

      if (pv != p) { // don't apply force to self
        vec4 weightSample = texture2D(weights, cindex);
        float weight = decode(weightSample.xy, scale.y);
        for (int x = -1; x <= 1; x++) {
          for (int y = -1; y <= 1; y++) {
            float dx = pv.x - (p.x +  worldsize.x * float(x));
            float dy = pv.y - (p.y +  worldsize.y * float(y));
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


  vec2 center = worldsize / 2.0;

  vec2 biotForce = 0.5 * (nv / (statesize.x * statesize.y));
  vec2 inertia = 0.1 * v;
  float distanceFromCenter = distance(p, center) / max(worldsize.x, worldsize.y);
  float radialForce = (tan(M_PI * distanceFromCenter + M_PI / 2.0) / 2.0) * (distanceFromCenter + 0.1) + 0.2;
  vec2 radialVector = 0.4 * normalize(center - p) * min(radialForce, 2.0);
  // vec2 radialForce = (normalize(center - p) * (pow(2.0, distance(p, center) / 200.0) - 1.0)) / 200.0;

  v = min(inertia + biotForce + radialVector, 1.0);

}

#pragma glslify: export(updateVelocity)
