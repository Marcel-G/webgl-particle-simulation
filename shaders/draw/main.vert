precision highp float;

attribute vec2 index;
uniform sampler2D positions;
uniform sampler2D velocities;
uniform sampler2D weights;
uniform vec2 statesize;
uniform vec2 worldsize;
uniform float size;
uniform vec2 scale;
varying vec2 velocity;
varying float weight;

float scalex() {
  return scale.x;
}
float scaley() {
  return scale.y;
}

#pragma glslify: getPositionAt = require('../utils/decodeAt', SAMPLE=positions, GETSCALE=scalex)
#pragma glslify: getVelocityAt = require('../utils/decodeAt', SAMPLE=velocities, GETSCALE=scaley)
#pragma glslify: getWeightAt = require('../utils/decodeAt', SAMPLE=weights, GETSCALE=scalex)

void main() {
    vec2 currentPosition = getPositionAt(index / (statesize - 1.0));
    vec2 currentVelocity = getVelocityAt(index / (statesize - 1.0));
    float currentWeight = getWeightAt(index / (statesize - 1.0)).x;

    weight = currentWeight;
    velocity = currentVelocity;
    gl_Position = vec4(3.0 * currentPosition / worldsize - 1.5, 0, 1); // extend 1 / 3 past screen boundry ontop of normalisation
    gl_PointSize = size;
}
