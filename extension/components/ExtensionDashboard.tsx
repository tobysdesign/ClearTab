/**
 * Extension Dashboard Component
 * Semantic layout matching current dashboard design
 */

import React, { useState, useRef } from 'react'
import { BackgroundCanvas } from './BackgroundCanvas'
import { ExtensionDock } from './ExtensionDock'
import { EmptyBentoGrid } from './EmptyBentoGrid'

export function ExtensionDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={`dashboard ${isLoading ? 'is-loading' : ''}`}
    >
      <BackgroundCanvas />

      {isLoading ? (
        <div className="loading-container">
          <img
            src="/assets/loading.gif"
            alt="Loading..."
            className="loading-image"
          />
        </div>
      ) : (
        <>
          <main className="dashboard__grid">
            <EmptyBentoGrid />
          </main>

          <div className="dashboard__dock">
            <ExtensionDock />
          </div>
        </>
      )}
    </div>
  )
}
