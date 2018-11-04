import createShader from 'gl-shader'
import getContext from 'webgl-context'
import loop from 'canvas-loop'
import createFbo from 'gl-fbo'
import triangle from 'a-big-triangle'
import createVao from 'gl-vao'
import pip from './lib/gl-texture2d-pip'
import createBuffer from 'gl-buffer'
import ndarray from 'ndarray'

const generateRandomPosition = () => {
  const radius = (2 * Math.random()) + 1.0
  const angle = Math.random() * 360 / Math.PI
  return [
    radius * Math.cos(angle),
    radius * Math.sin(angle)
  ]
}

const generatePositionData = size => {
  const particleStateData = new Float32Array(size * size * 4)
  for (var i = 0; i < particleStateData.length;) {
    const [x, y] = generateRandomPosition()
    particleStateData[i++] = x // position x
    particleStateData[i++] = y // position y
    particleStateData[i++] = 1.0 // velocity x
    particleStateData[i++] = 1.0 // velocity y
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

const generateParticalVaoData = (stateSize, count) => {
  let indexes = new Float32Array(stateSize * stateSize * 2 * count)
  for (var y = 0; y < stateSize; y++) {
    for (var x = 0; x < stateSize; x++) {
      var index = (y * stateSize * count) + (x * count)
      for (var i = 0; i < count; i++) {
        var f = (index + i) * 2
        indexes[f + 0] = x / (stateSize - 1)
        indexes[f + 1] = (i * stateSize + y) / ((stateSize * count) - 1)
      }
    }
  }
  return indexes
}

import particleLogicFrag from './shaders/particleLogic/main.frag'

import particleDrawFrag from './shaders/particleDraw/main.frag'
import particleDrawVert from './shaders/particleDraw/main.vert'

import trailsDrawFrag from './shaders/trailsLogic/main.frag'

import triangleVert from './shaders/triangle.vert'

class ParticleField {
  constructor(canvas, options) {
    this.options = {
      stateSize: 5,
      color: [1, 1, 1, 1],
      fps: 60,
      trailLength: 10,
      pauseOnHidden: true,
      debug: false,
      ...options
    }


    this.gl = getContext({
      canvas,
      antialias: true
    })

    this.canvas = canvas

    const app = loop(canvas, {
      scale: window.devicePixelRatio,
      parent: this.options.parent
    }).on('tick', this.render.bind(this))

    this.shaders = {
      particleLogic: createShader(this.gl, triangleVert, particleLogicFrag),
      particleDraw: createShader(this.gl, particleDrawVert, particleDrawFrag),
      trailsLogic: createShader(this.gl, triangleVert, trailsDrawFrag)
    }

    const { stateSize } = this.options

    this.frameBuffers = {
      particleState: {
        prev: createFbo(this.gl, [stateSize, stateSize], { float: true }),
        next: createFbo(this.gl, [stateSize, stateSize], { float: true }),
        weights: createFbo(this.gl, [stateSize, stateSize], { float: true })
      },
      trailState: {
        prev: createFbo(this.gl, [stateSize, stateSize * this.options.trailLength], { float: true }),
        next: createFbo(this.gl, [stateSize, stateSize * this.options.trailLength], { float: true }),
      }
    }

    const particleStateData = generatePositionData(stateSize)

    this.frameBuffers.particleState.prev.color[0].setPixels(ndarray(particleStateData, [stateSize, stateSize, 4]))
    this.frameBuffers.particleState.next.color[0].setPixels(ndarray(particleStateData, [stateSize, stateSize, 4]))

    const particleWeightData = generateWeightData(stateSize)

    this.frameBuffers.particleState.weights.color[0].setPixels(ndarray(particleWeightData, [stateSize, stateSize, 4]))

    this.shaders.particleLogic.attributes.position.location = 0
    this.shaders.particleDraw.attributes.position.location = 0

    this.frameBuffers.trailState.prev.color[0].setPixels(ndarray(0, [stateSize, stateSize * this.options.trailLength, 4]))
    this.frameBuffers.trailState.next.color[0].setPixels(ndarray(0, [stateSize, stateSize * this.options.trailLength, 4]))

    const particleVaoIndexes = generateParticalVaoData(stateSize, this.options.trailLength)

    this.particleVao = createVao(this.gl, [
      { 'buffer': createBuffer(this.gl, particleVaoIndexes, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW),
        'type': this.gl.FLOAT,
        'size': 2
      }
    ])

    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    this.gl.clearColor(0, 0, 0, 1)

    this.advanceTrail = 0
    this.frameCount = 0

    this.start = () => app.start()
    this.stop = () => app.stop()

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
      frameBuffers: { particleState },
      ping
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

    ping(particleState)

    const {
      shaders: { trailsLogic },
      frameBuffers: { trailState },
      particleVao,
      advanceTrail,
    } = this

    if (this.frameCount > 1) {
      this.advanceTrail = 1
      this.frameCount = 0
    } else {
      this.advanceTrail = 0
    }

    this.frameCount++

    trailState.next.bind()
    trailsLogic.bind()
    trailsLogic.uniforms.advanceTrail = advanceTrail
    trailsLogic.uniforms.stateCount = this.options.trailLength
    trailsLogic.uniforms.particleState = particleState.prev.color[0].bind(0)
    trailsLogic.uniforms.trailState = trailState.prev.color[0].bind(1)
    trailsLogic.uniforms.screenSize = [canvas.width, canvas.height]
    trailsLogic.uniforms.stateSize = stateSize
    gl.viewport(0, 0, stateSize, stateSize * this.options.trailLength)

    triangle(gl)

    ping(trailState)

    const {
      shaders: { particleDraw },
    } = this

    gl.enable(gl.BLEND)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)


    particleDraw.bind()
    particleDraw.uniforms.trailState = trailState.prev.color[0].bind(3)
    particleDraw.uniforms.screenSize = [canvas.width, canvas.height]
    particleDraw.uniforms.stateSize = stateSize

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    particleVao.bind()

    for (var i = 0; i < stateSize * stateSize; i++) {
      particleVao.draw(gl.LINE_STRIP, this.options.trailLength, i * this.options.trailLength)
      // particleVao.draw(gl.POINTS, 1, i * this.options.trailLength)
    }

    particleVao.unbind()

    gl.disable(gl.BLEND)

    if (this.options.debug) {
      pip([
        particleState.prev.color[0],
        particleState.next.color[0],
        trailState.prev.color[0],
        trailState.next.color[0],
        particleState.weights.color[0]
      ])
    }

    if (this.afterRender) this.afterRender()
  }
}

export default ParticleField
