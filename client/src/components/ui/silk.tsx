import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface SilkProps {
  className?: string
  children?: React.ReactNode
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  uniform vec2 mouse;
  uniform vec2 prevMouse;
  uniform float mouseActive;
  varying vec2 vUv;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for(int i = 0; i < 6; i++) {
      value += amplitude * smoothNoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 3.0;
    
    float t = time * 0.1;
    
    // Mouse position in UV coordinates
    vec2 mouseUv = mouse / resolution;
    mouseUv.y = 1.0 - mouseUv.y;
    vec2 prevMouseUv = prevMouse / resolution;
    prevMouseUv.y = 1.0 - prevMouseUv.y;
    
    // Calculate movement for disturbance
    vec2 mouseVelocity = mouseUv - prevMouseUv;
    float speed = length(mouseVelocity);
    
    // Create disturbance field around cursor movement
    float mouseDist = distance(uv, mouseUv);
    float disturbanceRadius = 0.2;
    float disturbance = smoothstep(disturbanceRadius, 0.0, mouseDist) * (speed * 50.0 + 1.0);
    
    // Apply disturbance to silk pattern coordinates
    vec2 distortedP = p + mouseVelocity * disturbance * 2.0;
    
    // Generate silk pattern with mouse-induced distortion
    vec2 q = vec2(0.0);
    q.x = fbm(distortedP + t * vec2(0.1, 0.05));
    q.y = fbm(distortedP + vec2(1.0) + t * vec2(0.05, 0.1));
    
    vec2 r = vec2(0.0);
    r.x = fbm(distortedP + 1.0 * q + vec2(1.7, 9.2) + t * 0.15);
    r.y = fbm(distortedP + 1.0 * q + vec2(8.3, 2.8) + t * 0.126);
    
    float f = fbm(distortedP + r + t * 0.1);
    
    // Base silk color
    vec3 color = vec3(0.02, 0.02, 0.03);
    
    color = mix(color,
                vec3(0.05, 0.05, 0.08),
                clamp((f*f)*4.0, 0.0, 1.0));
    
    color = mix(color,
                vec3(0.08, 0.08, 0.12),
                clamp(length(q), 0.0, 1.0));
    
    color = mix(color,
                vec3(0.12, 0.12, 0.16),
                clamp(length(r), 0.0, 1.0));
    
    float highlight = pow(max(0.0, f), 2.0);
    color += vec3(0.03, 0.03, 0.05) * highlight;
    
    float shimmer = sin(f * 8.0 + t * 2.0) * 0.01;
    color += shimmer;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export default function Silk({ className = "", children }: SilkProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.Camera
    renderer: THREE.WebGLRenderer
    material: THREE.ShaderMaterial
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        mouse: { value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5) },
        prevMouse: { value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5) },
        mouseActive: { value: 1.0 }
      }
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    camera.position.z = 1

    let startTime = Date.now()
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      material.uniforms.time.value = elapsed
      
      renderer.render(scene, camera)
      const animationId = requestAnimationFrame(animate)
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    sceneRef.current = { scene, camera, renderer, material, animationId: 0 }
    animate()

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      renderer.setSize(width, height)
      material.uniforms.resolution.value.set(width, height)
    }

    const handleMouseMove = (event: MouseEvent) => {
      // Store previous position
      material.uniforms.prevMouse.value.copy(material.uniforms.mouse.value)
      // Update current position
      material.uniforms.mouse.value.set(event.clientX, event.clientY)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement)
        }
        
        sceneRef.current.renderer.dispose()
        sceneRef.current = null
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mountRef} 
        className="fixed inset-0 -z-10 pointer-events-none"
      />
      {children}
    </div>
  )
}