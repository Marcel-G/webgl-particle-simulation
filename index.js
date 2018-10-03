import Igloo from './lib/igloo'

import stepMainV from './shaders/step/main.vert'
import stepMainF from './shaders/step/main.frag'

import drawMainV from './shaders/draw/main.vert'
import drawMainF from './shaders/draw/main.frag'

import trailsMainV from './shaders/trails/main.vert'
import trailsMainF from './shaders/trails/main.frag'

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

  constructor (canvas, options) {
    const igloo = this.igloo = new Igloo(canvas)
    const gl = igloo.gl
    this.options = {
      stateSize: 10,
      color: [1, 1, 1, 1],
      fps: 60,
      pauseOnHidden: true,
      ...options
    }

    this.fpsInterval = 1000 / this.options.fps

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
      step: igloo.program(stepMainV, stepMainF),
      draw: igloo.program(drawMainV, drawMainF),
      trails: igloo.program(trailsMainV, trailsMainF)
    }

    const texture = () => {
      return igloo.texture(null, gl.RGBA, gl.CLAMP_TO_EDGE, gl.NEAREST)
    }

    this.textures = {
      p0: texture(),
      p1: texture(),
      v0: texture(),
      v1: texture(),
      w: texture(),
      particles: texture(),
      trails0: texture(),
      trails1: texture()
    }
    this.framebuffers = {
      step: igloo.framebuffer(),
      draw: igloo.framebuffer(),
      trails: igloo.framebuffer()
    }
    this.setCount(Math.pow(this.options.stateSize, 2), true)
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
        const radius = Math.max(w, h) / 10 + Math.random() * 100
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
    this.textures.particles.blank(w, h)
    this.textures.trails0.blank(w, h)
    this.textures.trails1.blank(w, h)

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
    this.textures.particles.bind(3)
    this.textures.trails0.bind(4)

    this.initStep()
    this.initDraw()
    this.initTrails()
  }

  initStep () {
    this.programs.step.use()
      .uniformi('positions', 0)
      .uniformi('velocities', 1)
      .uniformi('weights', 2)
      .uniform('statesize', this.statesize)
  }

  step (frameInterval) {
    const igloo = this.igloo
    const gl = igloo.gl

    gl.viewport(0, 0, this.statesize[0], this.statesize[1])
    this.programs.step.use()
      .uniform('scale', this.scale)
      .uniform('worldsize', this.worldsize)
      .uniform('frameInterval', frameInterval)
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

    this.framebuffers.draw.attach(this.textures.particles)
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

  initTrails () {
    this.programs.trails.use()
      .uniformi('particles', 3)
      .uniformi('trails', 4)
  }

  trails () {
    const igloo = this.igloo
    const gl = igloo.gl

    this.framebuffers.trails.attach(this.textures.trails1)

    gl.enable(gl.BLEND)

    gl.viewport(0, 0, this.worldsize[0], this.worldsize[1])

    gl.clear(gl.COLOR_BUFFER_BIT)

    this.programs.trails.use()
      .attrib('quad', this.buffers.quad, 2)
      .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2)

    igloo.defaultFramebuffer.bind()

    this.programs.trails.use()
      .attrib('quad', this.buffers.quad, 2)
      .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2)

    const tmp = this.textures.trails0
    this.textures.trails0 = this.textures.trails1
    this.textures.trails1 = tmp

    this.textures.trails0.bind(4)

    gl.disable(gl.BLEND)

    return this
  }
  frame (newtime) {
    const now = newtime
    const elapsed = now - this.lastFrameTime
    if (elapsed > this.fpsInterval) {
      this.lastFrameTime = now - (elapsed % this.fpsInterval)

      if (
        this.running &&
        (this.options.pauseOnHidden ? !document.hidden : true)
      ) {
        this.step(elapsed).draw().trails()
      }
    }
    this.afterRender && this.afterRender()
    window.requestAnimationFrame(this.frame.bind(this))
    return this
  }
  start () {
    if (!this.running) {
      this.running = true
      this.lastFrameTime = window.performance.now()
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
