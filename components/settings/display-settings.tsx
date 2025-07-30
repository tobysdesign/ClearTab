'use client'

import { LayoutToggle } from '@/components/ui/layout-toggle'
import { useLayout } from '@/hooks/use-layout'

export function DisplaySettings() {
  const { layout } = useLayout()
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Layout</h2>
        <p className="text-sm text-gray-400 mb-4">
          Choose how your widgets are arranged on the screen.
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium text-white">Current Layout</div>
            <div className="text-sm text-gray-400">
              {layout === 'two-row' ? 'Two-row grid layout' : 'Single-row layout'}
            </div>
          </div>
          <LayoutToggle variant="settings" />
        </div>
        
        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <strong className="text-white">Two-row layout:</strong> Notes and Tasks span the top half, with Weather, Recorder, Finance, and Schedule widgets arranged in the bottom row.
          </div>
          <div>
            <strong className="text-white">Single-row layout:</strong> Notes takes up most of the left side, with smaller widgets below it, and Tasks and Schedule on the right side.
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-white mb-3">Dock & Interface</h2>
        <p className="text-sm text-gray-400 mb-4">
          Customize the floating dock and interface elements.
        </p>
        <div className="text-sm text-gray-400">
          Additional dock and interface customization options coming soon.
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-white mb-3">Background</h2>
        <p className="text-sm text-gray-400 mb-4">
          Personalize your workspace background.
        </p>
        <div className="text-sm text-gray-400">
          Background customization options coming soon.
        </div>
      </div>
    </div>
  )
}