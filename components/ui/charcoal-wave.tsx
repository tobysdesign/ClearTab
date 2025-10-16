'use client'

import React, { useRef, useEffect } from 'react'
import styles from './charcoal-wave.module.css'

interface Circle {
  x: number
  y: number
  radius: number
  color: number[]
  vx: number
  vy: number
  interactive: boolean
}

export function CharcoalWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas element not found')
      return
    }

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    // --- Helper Functions ---
    function debounce(func: () => void, wait: number) {
      let timeout: NodeJS.Timeout
      return function executedFunction(...args: []) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    }

    // --- WebGL Setup ---
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const circleColors = [
      [0.12, 0.12, 0.12],
      [0.18, 0.18, 0.18],
      [0.25, 0.25, 0.25],
      [0.1, 0.1, 0.1],
      [0.3, 0.3, 0.3],
      [0.2, 0.2, 0.2],
    ]

    const MAX_CIRCLES = 6
    let circles: Circle[] = []

    // Pre-allocate typed arrays to avoid per-frame garbage collection
    const circlesColorArray = new Float32Array(MAX_CIRCLES * 3)
    const circlesPosRadArray = new Float32Array(MAX_CIRCLES * 3)

    function initCircles() {
      circles = []
      const baseRadius = (width + height) * 0.2
      for (let i = 0; i < MAX_CIRCLES - 1; i++) {
        circles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: baseRadius,
          color: circleColors[i],
          vx: (Math.random() - 0.5) * (Math.random() * 4 + 1),
          vy: (Math.random() - 0.5) * (Math.random() * 4 + 1),
          interactive: false,
        })
      }
      // Interactive circle
      circles.push({
        x: width / 2,
        y: height / 2,
        radius: (width + height) * 0.1,
        color: circleColors[MAX_CIRCLES - 1],
        vx: 0,
        vy: 0,
        interactive: true,
      })
    }

    initCircles()

    // --- Event Listeners ---
    const mouse = { x: width / 2, y: height / 2 }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)

    function resizeCanvas() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      gl.viewport(0, 0, width, height)
    }

    const debouncedResize = debounce(() => {
      resizeCanvas()
      initCircles()
    }, 250)
    window.addEventListener('resize', debouncedResize)

    // --- Shaders & Program ---
    const vertexSrc = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main(void) {
        v_uv = a_position * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fragmentSrc = `
      precision mediump float;
      varying vec2 v_uv;

      uniform vec2 u_resolution;
      uniform int u_circleCount;
      uniform vec3 u_circlesColor[6];
      uniform vec3 u_circlesPosRad[6];
      uniform vec2 u_mouse;
      uniform float u_time;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main(void) {
        vec2 st = v_uv * u_resolution;
        vec3 bgColor = vec3(0.06, 0.06, 0.06); // Slightly lighter than black

        float fieldSum = 0.0;
        vec3 weightedColorSum = vec3(0.0);

        for (int i = 0; i < 6; i++) {
          if (i >= u_circleCount) break;
          vec3 posRad = u_circlesPosRad[i];
          vec2 cPos = posRad.xy;
          float radius = posRad.z;

          float dist = length(st - cPos);
          float sigma = radius * 0.45 * (0.8 + 0.2 * sin(u_time * 0.5));
          float val = exp(- (dist * dist) / (2.0 * sigma * sigma)) * 1.4;

          fieldSum += val;
          weightedColorSum += u_circlesColor[i] * val;
        }

        vec3 finalCirclesColor = vec3(0.0);
        if (fieldSum > 0.001) {
          finalCirclesColor = weightedColorSum / fieldSum;
        }

        float intensity = smoothstep(0.15, 0.95, pow(fieldSum, 1.6));
        vec3 finalColor = mix(bgColor, finalCirclesColor, intensity);

        float grain = random(st + u_mouse + finalColor.xy * 0.5) - 0.5;
        finalColor += grain * 0.03;

        gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
      }
    `

    function createShader(type: number, source: string) {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = createShader(gl.VERTEX_SHADER, vertexSrc)
    const fragShader = createShader(gl.FRAGMENT_SHADER, fragmentSrc)
    if (!vertShader || !fragShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    // --- Buffers and Uniforms ---
    const quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const a_position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(a_position)
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

    // Cache uniform locations
    const u_resolution = gl.getUniformLocation(program, 'u_resolution')
    const u_circleCount = gl.getUniformLocation(program, 'u_circleCount')
    const u_circlesColor = gl.getUniformLocation(program, 'u_circlesColor')
    const u_circlesPosRad = gl.getUniformLocation(program, 'u_circlesPosRad')
    const u_mouse = gl.getUniformLocation(program, 'u_mouse')
    const u_time = gl.getUniformLocation(program, 'u_time')
    

    // --- Animation Loop ---
    const startTime = performance.now()
    let animationFrameId: number

    function updateCircles() {
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i]
        if (!c.interactive) {
          c.x += c.vx
          c.y += c.vy
          if (c.x - c.radius > width) c.x = -c.radius
          if (c.x + c.radius < 0) c.x = width + c.radius
          if (c.y - c.radius > height) c.y = -c.radius
          if (c.y + c.radius < 0) c.y = height + c.radius
        } else {
          c.x += (mouse.x - c.x) * 0.1
          c.y += (mouse.y - c.y) * 0.1
        }
      }
    }

    function render(now: number) {
      const elapsed = (now - startTime) / 1000.0
      updateCircles()

      gl.viewport(0, 0, width, height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(program)

      // Update uniform values
      gl.uniform1i(u_circleCount, circles.length)
      gl.uniform2f(u_resolution, width, height)
      gl.uniform2f(u_mouse, mouse.x, mouse.y)
      gl.uniform1f(u_time, elapsed)

      // Update the pre-allocated arrays
      for (let i = 0; i < MAX_CIRCLES; i++) {
        const c = circles[i]
        const colorIndex = i * 3
        const posRadIndex = i * 3

        if (c) {
          circlesColorArray[colorIndex] = c.color[0]
          circlesColorArray[colorIndex + 1] = c.color[1]
          circlesColorArray[colorIndex + 2] = c.color[2]

          circlesPosRadArray[posRadIndex] = c.x
          circlesPosRadArray[posRadIndex + 1] = c.y
          circlesPosRadArray[posRadIndex + 2] = c.radius
        }
      }

      // Pass the updated arrays to the shader
      gl.uniform3fv(u_circlesColor, circlesColorArray)
      gl.uniform3fv(u_circlesPosRad, circlesPosRadArray)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', debouncedResize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    />
  )
}