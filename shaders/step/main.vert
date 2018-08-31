precision highp float;

attribute vec2 quad;
uniform vec2 randomSeed;
varying vec2 index;
varying vec2 random;

highp float rand( vec2 p ) {
  vec2 K1 = vec2(
    23.14069263277926, // e^pi (Gelfond's constant)
    2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
  );
  return fract(cos( dot(p,K1) ) * 12345.6789 );
}

void main() {
  index = (quad + 1.0) / 2.0;
  random = vec2(rand(index * randomSeed), rand(1.0 - index * randomSeed));
  gl_Position = vec4(quad, 0, 1);
}
