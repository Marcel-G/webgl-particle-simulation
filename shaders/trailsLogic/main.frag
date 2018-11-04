// Trails Logic Fragment Shader

precision highp float;

uniform sampler2D particleState;
uniform sampler2D trailState;
uniform vec2 screenSize;
uniform float stateSize;
uniform float stateCount;
uniform float advanceTrail;


void main() {
  vec2 uv = gl_FragCoord.xy / vec2(stateSize, stateSize * stateCount);

  float lowerBoundary = 0.0;
  float upperBoundary = lowerBoundary + (1.0 / stateCount);

  if (
    uv.y > lowerBoundary &&
    uv.y < upperBoundary
    ) {
    gl_FragColor = vec4(
      texture2D(
        particleState,
        gl_FragCoord.xy / stateSize
      ).xy,
      vec2(1.0)
    );
  } else {
    vec4 trailSample = texture2D(
        trailState,
        vec2(uv.x, uv.y - (advanceTrail * (1.0 / stateCount)))
      );

    gl_FragColor = vec4(
      trailSample.xy,
      1.0,
      max(trailSample.w - 0.05, 0.0)
    );
  }
}
