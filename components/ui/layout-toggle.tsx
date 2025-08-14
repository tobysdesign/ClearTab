'use client'

import { useLayout } from '@/hooks/use-layout'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Grid3x3 from 'lucide-react/dist/esm/icons/grid-3x3'
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid'

interface LayoutToggleProps {
  variant?: 'dock' | 'settings'
}

export function LayoutToggle({ variant = 'dock' }: LayoutToggleProps) {
  const { layout, toggleLayout } = useLayout()
  
  if (variant === 'dock') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLayout}
              className="rounded-lg p-2 hover:bg-white/20 transition-all duration-200 ease-out text-white/60 hover:text-white/80"
            >
              {layout === 'two-row' ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Switch to {layout === 'two-row' ? 'single-row' : 'two-row'} layout
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={toggleLayout}
      className="flex items-center gap-2"
    >
      {layout === 'two-row' ? (
        <>
          <LayoutGrid className="h-4 w-4" />
          Switch to Single Row
        </>
      ) : (
        <>
          <Grid3x3 className="h-4 w-4" />
          Switch to Two Row
        </>
      )}
    </Button>
  )
}