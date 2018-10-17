// Trails Logic Fragment Shader

precision highp float;

uniform sampler2D particleState;
uniform sampler2D trailState;
uniform vec2 screenSize;
uniform float stateSize;
uniform float advanceTrail;


void main() {
  vec2 uv = gl_FragCoord.xy / vec2(stateSize, stateSize * 5.0);

  float lowerBoundary = 0.0;
  float upperBoundary = lowerBoundary + (1.0 / 5.0);

  if (
    uv.y > lowerBoundary &&
    uv.y < upperBoundary
    ) {
    gl_FragColor = vec4(
      texture2D(
        particleState,
        gl_FragCoord.xy / stateSize
      ).xy,
      vec2(0.0)
    );
  } else {
    gl_FragColor = vec4(
      texture2D(
        trailState,
        vec2(uv.x, uv.y - (advanceTrail * (1.0 / 5.0)))
      ).xy,
      vec2(1.0)
    );
  }
}
