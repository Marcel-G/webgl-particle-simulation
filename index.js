import Igloo from './lib/igloo'

import quadV from './shaders/quad.vert'
import stepF from './shaders/step.frag'

import drawV from './shaders/draw.vert'
import drawF from './shaders/draw.frag'

class ParticleField {
  static BASE = 255
  static encode (value, scale) {
    var b = ParticleField.BASE
    value = value * scale + b * b / 2
    var pair = [
      Math.floor((value % b) / b * 255),
      Math.floor(Math.floor(value / b) / b * 255)
    ]
    return pair
  }

  static decode (pair, scale) {
    var b = ParticleField.BASE
    return (((pair[0] / 255) * b + (pair[1] / 255) * b * b) - b * b / 2) / scale
  }

  setWorldDimensions = () => {
    var devicePixelRatio = window.devicePixelRatio || 1
    var w = Math.floor(this.igloo.canvas.offsetWidth * devicePixelRatio)
    var h = Math.floor(this.igloo.canvas.offsetHeight * devicePixelRatio)
    if (this.igloo.canvas.width !== w || this.igloo.canvas.height !== h) {
      this.igloo.canvas.width = w
      this.igloo.canvas.height = h
    }
    this.worldsize = new Float32Array([this.igloo.canvas.width, this.igloo.canvas.height])
  }

  constructor (canvas, options) {
    const igloo = this.igloo = new Igloo(canvas)
    const gl = igloo.gl
    this.options = {
      stateSize: 10,
      color: [1, 1, 1, 1],
      ...options
    }

    this.setWorldDimensions()

    const scale = Math.floor(Math.pow(ParticleField.BASE, 2) / Math.max(this.worldsize[0], this.worldsize[1]) / 3)
    this.scale = [scale, scale * 10]
    this.size = 5

    gl.disable(gl.DEPTH_TEST)

    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) === 0) {
      var msg = 'Vertex shader texture access not available.' +
        'Try again on another platform.'
      alert(msg)
      throw new Error(msg)
    }

    this.color = this.options.color
    this.running = false

    this.buffers = {
      quad: igloo.array(Igloo.QUAD2),
      indexes: igloo.array(),
      point: igloo.array(new Float32Array([0, 0]))
    }

    this.programs = {
      step: igloo.program(quadV, stepF),
      draw: igloo.program(drawV, drawF)
    }

    const texture = () => {
      return igloo.texture(null, gl.RGBA, gl.CLAMP_TO_EDGE, gl.NEAREST)
    }

    this.textures = {
      p0: texture(),
      p1: texture(),
      v0: texture(),
      v1: texture(),
      w: texture()
    }
    this.framebuffers = {
      step: igloo.framebuffer()
    }
    this.setCount(Math.pow(this.options.stateSize, 2), true)
  }

  setCount (n) {
    const tw = Math.ceil(Math.sqrt(n))
    const th = Math.floor(Math.sqrt(n))
    this.statesize = new Float32Array([tw, th])
    this.initTextures()
    this.initBuffers()
    return this
  }

  initTextures () {
    const [tw, th] = this.statesize
    const [w, h] = this.worldsize
    const s = this.scale
    let rgbaP = new Uint8Array(tw * th * 4) // stores positon vec2
    let rgbaV = new Uint8Array(tw * th * 4) // stores velocity vec2
    let rgbaW = new Uint8Array(tw * th * 4) // stores weights float
    for (var y = 0; y < th; y++) {
      for (var x = 0; x < tw; x++) {
        const i = y * tw * 4 + x * 4
        // calculate random position on outer circle boundry
        const radius = Math.max(w, h) / 2 + Math.random() * 100
        const angle = Math.random() * 360 / Math.PI
        const px = ParticleField.encode(radius * Math.cos(angle) + (w / 2), s[0])
        const py = ParticleField.encode(radius * Math.sin(angle) + (h / 2), s[0])

        const vx = ParticleField.encode(0.0, s[1])
        const vy = ParticleField.encode(0.0, s[1])
        const wv = ParticleField.encode(2 * Math.random() - 1, s[1])
        rgbaP[i + 0] = px[0]
        rgbaP[i + 1] = px[1]
        rgbaP[i + 2] = py[0]
        rgbaP[i + 3] = py[1]
        rgbaV[i + 0] = vx[0]
        rgbaV[i + 1] = vx[1]
        rgbaV[i + 2] = vy[0]
        rgbaV[i + 3] = vy[1]
        rgbaW[i + 0] = wv[0]
        rgbaW[i + 1] = wv[1]
      }
    }
    this.textures.p0.set(rgbaP, tw, th)
    this.textures.v0.set(rgbaV, tw, th)
    this.textures.w.set(rgbaW, tw, th)
    this.textures.p1.blank(tw, th)
    this.textures.v1.blank(tw, th)
    return this
  }

  initBuffers () {
    const [tw, th] = this.statesize
    const gl = this.igloo.gl
    let indexes = new Float32Array(tw * th * 2)
    for (var y = 0; y < th; y++) {
      for (var x = 0; x < tw; x++) {
        var i = y * tw * 2 + x * 2
        indexes[i + 0] = x
        indexes[i + 1] = y
      }
    }
    this.buffers.indexes.update(indexes, gl.STATIC_DRAW)
    return this
  }

  swapPositionTextures () {
    const tmp = this.textures.p0
    this.textures.p0 = this.textures.p1
    this.textures.p1 = tmp

    this.textures.p0.bind(0)

    return this
  }

  swapVelocityTextures () {
    const tmp = this.textures.v0
    this.textures.v0 = this.textures.v1
    this.textures.v1 = tmp

    this.textures.v0.bind(1)

    return this
  }

  init () {
    const igloo = this.igloo
    const gl = igloo.gl
    gl.disable(gl.BLEND)

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 1)

    this.textures.p0.bind(0)
    this.textures.v0.bind(1)
    this.textures.w.bind(2)

    this.initStep()
    this.initDraw()
  }

  initStep () {
    this.programs.step.use()
      .uniformi('positions', 0)
      .uniformi('velocities', 1)
      .uniformi('weights', 2)
      .uniform('statesize', this.statesize)
  }

  step () {
    const igloo = this.igloo
    const gl = igloo.gl

    gl.viewport(0, 0, this.statesize[0], this.statesize[1])

    this.programs.step.use()
      .uniform('scale', this.scale)
      .uniform('worldsize', this.worldsize)
      .uniform('randomSeed', [Math.random(), Math.random()])
      .attrib('quad', this.buffers.quad, 2)

    // update velocities
    this.framebuffers.step.attach(this.textures.v1)
    this.programs.step
      .uniformi('derivative', 0)
      .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2)

    this.swapVelocityTextures()

    // update position
    this.framebuffers.step.attach(this.textures.p1)
    this.programs.step
      .uniformi('derivative', 1)
      .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2)

    this.swapPositionTextures()

    return this
  }

  initDraw () {
    this.programs.draw.use()
      .uniformi('positions', 0)
      .uniformi('velocities', 1)
      .uniformi('weights', 2)
      .uniform('size', this.size)
      .uniform('statesize', this.statesize)
      .uniform('color', this.color)
  }

  draw () {
    const igloo = this.igloo
    const gl = igloo.gl

    igloo.defaultFramebuffer.bind()
    gl.enable(gl.BLEND)

    gl.viewport(0, 0, this.worldsize[0], this.worldsize[1])

    gl.clear(gl.COLOR_BUFFER_BIT)

    this.programs.draw.use()
      .uniform('scale', this.scale)
      .uniform('worldsize', this.worldsize)
      .attrib('index', this.buffers.indexes, 2)
      .draw(gl.POINTS, this.statesize[0] * this.statesize[1])

    gl.disable(gl.BLEND)
    return this
  }
  frame () {
    window.requestAnimationFrame(() => {
      if (this.running && !document.hidden) {
        this.step().draw().frame()
        this.afterRender && this.afterRender()
      }
    })
    return this
  }
  start () {
    if (!this.running) {
      this.running = true
      this.init()
      this.frame()
    }
    return this
  }
  stop () {
    this.running = false
    return this
  }
  clearInstance = () => {
    this.stop()
    this.igloo.gl.getExtension('WEBGL_lose_context').loseContext()
  }
}

export default ParticleField
