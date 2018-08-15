![WebGL Biot Savart Simulation](https://raw.githubusercontent.com/Marcel-G/webgl-particle-simulation/master/assets/sample.gif)

# GPU particle simulation

The purpose of this project is to explore using the GPU (WebGL) to calculate particle simulations. Here, the shaders does all the heavy lifting. Particle state data (position, velocity and weight) is all stored as textures in GPU memory.

## Biot Savart Field

The above simulation is based on biot savart calculation for magnetic fields. The velocity of a given particle is based on the 'magnetic' field force on that particle by every other particle in the simulation.

## Setup

To build from source for development:

1. Install the latest [Node.js and NPM](https://nodejs.org).
2. Run `npm install` within the project root directory in Terminal.
3. Run `npm run dev`.

## References
- [A GPU Approach to Particle Physics - Chris Wellons](https://nullprogram.com/blog/2014/06/29/)
