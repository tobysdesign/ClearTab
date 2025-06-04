"use client"

import { useEffect, useRef } from "react"

interface Point {
  x: number
  y: number
  originX: number
  originY: number
}

interface SilkBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export default function SilkBackground({ className = "", children }: SilkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const initPoints = () => {
      pointsRef.current = []
      const spacing = 80
      const rows = Math.ceil(canvas.height / spacing) + 2
      const cols = Math.ceil(canvas.width / spacing) + 2

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing - spacing
          const y = row * spacing - spacing
          pointsRef.current.push({
            x,
            y,
            originX: x,
            originY: y,
          })
        }
      }
    }

    const drawSilk = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Set base background
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update point positions with silk-like movement
      pointsRef.current.forEach((point) => {
        const waveX = Math.sin(time * 0.0005 + point.originY * 0.01) * 30
        const waveY = Math.cos(time * 0.0003 + point.originX * 0.01) * 20
        point.x = point.originX + waveX
        point.y = point.originY + waveY
      })

      // Create silk effect with gradients
      const spacing = 80
      const rows = Math.ceil(canvas.height / spacing) + 2
      const cols = Math.ceil(canvas.width / spacing) + 2

      for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
          const index = row * cols + col
          const point1 = pointsRef.current[index]
          const point2 = pointsRef.current[index + 1]
          const point3 = pointsRef.current[index + cols]
          const point4 = pointsRef.current[index + cols + 1]

          if (point1 && point2 && point3 && point4) {
            // Create silk sheen effect
            const gradient = ctx.createLinearGradient(
              point1.x, point1.y,
              point4.x, point4.y
            )
            
            const intensity = Math.sin(time * 0.001 + (point1.x + point1.y) * 0.01) * 0.5 + 0.5
            const alpha = 0.02 + intensity * 0.03

            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`)
            gradient.addColorStop(0.5, `rgba(240, 240, 255, ${alpha})`)
            gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.3})`)

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.moveTo(point1.x, point1.y)
            ctx.lineTo(point2.x, point2.y)
            ctx.lineTo(point4.x, point4.y)
            ctx.lineTo(point3.x, point3.y)
            ctx.closePath()
            ctx.fill()
          }
        }
      }

      // Add subtle overlay patterns
      const overlayGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      
      overlayGradient.addColorStop(0, "rgba(255, 255, 255, 0.01)")
      overlayGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.005)")
      overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.02)")
      
      ctx.fillStyle = overlayGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const animate = (time: number) => {
      drawSilk(time)
      animationRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      resizeCanvas()
      initPoints()
    }

    // Initialize
    resizeCanvas()
    initPoints()
    animate(0)

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: "#0a0a0a",
        }}
      />
      {children}
    </div>
  )
}