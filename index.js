import createShader from 'gl-shader'
import getContext from 'gl-context'
import createFbo from 'gl-fbo'
import triangle from 'a-big-triangle'
import createVao from 'gl-vao'
import createBuffer from 'gl-buffer'
import ndarray from 'ndarray'

const generatePositionData = size => {
  const particleStateData = new Float32Array(size * size * 4)
  for (var i = 0; i < particleStateData.length;) {
    particleStateData[i++] = (Math.random() - 0.5) * 2 // position x
    particleStateData[i++] = (Math.random() - 0.5) * 2 // position y
    particleStateData[i++] = 0 // velocity x
    particleStateData[i++] = 0 // velocity y
    // posdata[i++] = Math.random() // weight
  }
  return particleStateData
}

const generateWeightData = size => {
  const particleWeightData = new Float32Array(size * size * 4)
  for (var i = 0; i < particleWeightData.length;) {
    particleWeightData[i++] = (Math.random() - 0.5) * 2 // weight
    particleWeightData[i++] = 0
    particleWeightData[i++] = 0
    particleWeightData[i++] = 0
  }
  return particleWeightData
}

const generateParticalVaoData = stateSize => {
  let indexes = new Float32Array(stateSize * stateSize * 2)
  for (var y = 0; y < stateSize; y++) {
    for (var x = 0; x < stateSize; x++) {
      var i = y * stateSize * 2 + x * 2
      indexes[i + 0] = x
      indexes[i + 1] = y
    }
  }
  return indexes
}

import particleLogicFrag from './shaders/particleLogic/main.frag'
import particleLogicVert from './shaders/particleLogic/main.vert'

import particleDrawFrag from './shaders/particleDraw/main.frag'
import particleDrawVert from './shaders/particleDraw/main.vert'

import triangleVert from './shaders/triangle.vert'

class ParticleField {
  constructor(canvas, options) {
    this.options = {
      stateSize: 10,
      color: [1, 1, 1, 1],
      fps: 60,
      pauseOnHidden: true,
      ...options
    }

    this.canvas = canvas

    this.gl = getContext(canvas, this.render.bind(this))

    this.shaders = {
      particleLogic: createShader(this.gl, triangleVert, particleLogicFrag),
      particleDraw: createShader(this.gl, particleDrawVert, particleDrawFrag)
    }

    const { stateSize } = this.options

    this.frameBuffers = {
      particleState: {
        prev: createFbo(this.gl, [stateSize, stateSize], { float: true }),
        next: createFbo(this.gl, [stateSize, stateSize], { float: true }),
        weights: createFbo(this.gl, [stateSize, stateSize], { float: true })
      }
    }

    const particleStateData = generatePositionData(stateSize)

    this.frameBuffers.particleState.prev.color[0].setPixels(ndarray(particleStateData, [stateSize, stateSize, 4]))
    this.frameBuffers.particleState.next.color[0].setPixels(ndarray(particleStateData, [stateSize, stateSize, 4]))

    const particleWeightData = generateWeightData(stateSize)

    this.frameBuffers.particleState.weights.color[0].setPixels(ndarray(particleWeightData, [stateSize, stateSize, 4]))

    this.shaders.particleLogic.attributes.position.location = 0
    // this.shaders.particleDraw.attributes.position.location = 0

    const particleVaoIndexes = generateParticalVaoData(stateSize)

    this.particleVao = createVao(this.gl, [
      { 'buffer': createBuffer(this.gl, particleVaoIndexes, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW),
        'type': this.gl.FLOAT,
        'size': 2
      }
    ])
  }

  ping(pong) {
    var next = pong.next
    var prev = pong.prev
    pong.next = prev
    pong.prev = next
  }

  render() {
    const {
      gl,
      canvas,
      options: { stateSize },
      shaders: { particleLogic },
      frameBuffers: { particleState }
    } = this


    particleState.next.bind()
    particleLogic.bind()
    particleLogic.uniforms.particleState = particleState.prev.color[0].bind(0)
    particleLogic.uniforms.particleWeights = particleState.weights.color[0].bind(1)
    particleLogic.uniforms.screenSize = [canvas.width, canvas.height]
    particleLogic.uniforms.stateSize = stateSize
    gl.viewport(0, 0, stateSize, stateSize)

    triangle(gl)

    gl.disable(gl.DEPTH_TEST)


    const {
      shaders: { particleDraw },
      ping
    } = this

    ping(particleState)

    gl.enable(gl.BLEND)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    particleDraw.bind()
    particleDraw.uniforms.particleState = particleState.prev.color[0].bind(0)
    particleDraw.uniforms.screenSize = [canvas.width, canvas.height]
    particleDraw.uniforms.stateSize = stateSize

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.particleVao.bind()
    this.particleVao.draw(gl.POINTS, stateSize * stateSize)
    this.particleVao.unbind()

    gl.disable(gl.BLEND)

  }
}

export default ParticleField
