'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from './button'
import { SlidersHorizontal } from 'lucide-react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export function CharcoalWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particleCount, setParticleCount] = useState(500)
  const [maxSpeed, setMaxSpeed] = useState(1.5)
  const [controlsVisible, setControlsVisible] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width: number, height: number
    let particles: Particle[] = []

    const createParticle = (): Particle => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.random() * maxSpeed + 0.5, // Constant rightward velocity
        vy: (Math.random() - 0.5) * 0.5,   // Slight vertical drift
      }
    }

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      particles = Array.from({ length: particleCount }, createParticle)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let animationFrameId: number
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      
      particles.forEach((p) => {
        // Update position
        p.x += p.vx
        p.y += p.vy
        
        // Wrap particles that go off screen
        if (p.x > width) {
            p.x = 0
            p.y = Math.random() * height // Re-randomize y to avoid lines
        }
        if (p.y > height) {
            p.y = 0
        } else if (p.y < 0) {
            p.y = height
        }
        
        // Add a little turbulence/wind effect
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vx = Math.max(0.5, Math.min(p.vx, maxSpeed));

        // Draw particle
        ctx.fillStyle = `rgba(210, 180, 140, 0.7)` // Sandy color
        ctx.fillRect(p.x, p.y, 1.5, 1.5)
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [particleCount, maxSpeed])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-[-1] bg-[#1a1a1a]"
      />
      <div className="fixed bottom-4 left-4 z-10 text-white text-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setControlsVisible(!controlsVisible)}
          className="bg-black/50 hover:bg-black/75 backdrop-blur rounded-full"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        
        {controlsVisible && (
          <div className="mt-2 bg-black/50 px-4 py-2 rounded backdrop-blur w-48">
            <label className="block mb-2">
              Particles: {particleCount}
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <label className="block">
              Speed: {maxSpeed.toFixed(1)}
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(Number(e.target.value))}
                className="w-full"
              />
            </label>
          </div>
        )}
      </div>
    </>
  )
}