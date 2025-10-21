'use client'

// Custom SVG icon components
import { SearchIcon } from '@/components/icons'
import { ShinyAiButton } from '@/components/ui/shiny-ai-button'
import { SettingsTrigger } from '@/components/settings/settings-trigger'
import { cn } from '@/lib/utils'
import styles from './dock-content.module.css'

interface LoginDockContentProps {
    isVertical: boolean
}

export function LoginDockContent({
    isVertical
}: LoginDockContentProps) {
    return (
        <div className={cn(
            styles.container,
            isVertical ? styles.containerVertical : styles.containerHorizontal
        )}>
            {/* Search button - disabled */}
            <button
                className={cn(
                    styles.iconButton,
                    'opacity-50 cursor-not-allowed'
                )}
                disabled
            >
                <SearchIcon size={16} className="text-white/40" />
            </button>

            {/* AI Chat button - disabled */}
            <div className="opacity-50">
                <ShinyAiButton
                    className="cursor-not-allowed pointer-events-none"
                />
            </div>

            {/* Settings button - disabled */}
            <div className="opacity-50 cursor-not-allowed pointer-events-none">
                <SettingsTrigger />
            </div>
        </div>
    )
}