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

const float BASE = 255.0;
const float OFFSET = BASE * BASE / 2.0;

float decode(vec2 channels, float scale) {
    return (dot(channels, vec2(BASE, BASE * BASE)) - OFFSET) / scale;
}

void main() {
    vec4 psample = texture2D(positions, index / (statesize - 1.0));
    vec2 p = vec2(decode(psample.rg, scale.x), decode(psample.ba, scale.x));

    vec4 vsample = texture2D(velocities, index / (statesize - 1.0));
    vec2 v = vec2(decode(vsample.rg, scale.y), decode(vsample.ba, scale.y));

    vec4 wsample = texture2D(weights, index / (statesize - 1.0));
    float w = decode(wsample.xy, scale.y);

    weight = w;
    velocity = v;
    gl_Position = vec4(3.0 * p / worldsize - 1.5, 0, 1); // extend 1 / 3 past screen boundry ontop of normalisation
    gl_PointSize = size;
}
