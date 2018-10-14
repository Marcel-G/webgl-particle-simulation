// Trails Logic Fragment Shader

precision highp float;

uniform sampler2D particleState;
uniform sampler2D trailState;
uniform vec2 screenSize;
uniform float stateSize;
uniform float advanceTrail;
varying vec2 vUv;


void main() {
  float lowerBoundary = 0.0;
  float upperBoundary = lowerBoundary + (0.5 / 5.0);

  if (
    vUv.y > lowerBoundary &&
    vUv.y < upperBoundary
    ) {
    gl_FragColor = vec4(
      texture2D(
        particleState,
        vUv
      ).xy,
      vec2(0.0)
    );
  } else {
    // gl_FragColor = vec4(0.5);
    gl_FragColor = vec4(
      texture2D(
        trailState,
        vec2(vUv.x, vUv.y - (advanceTrail * (1.0 / 5.0)))
      ).xy,
      vec2(1.0)
    );
  }
}
