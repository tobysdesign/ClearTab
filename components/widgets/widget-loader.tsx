import { cn } from '@/lib/utils'
import { BrandedLoader } from '@/components/ui/branded-loader'
import styles from './widget-loader.module.css'

interface WidgetLoaderProps {
  className?: string
  minHeight?: string
}

export function WidgetLoader({ className = '', minHeight = 'min-h-[16rem]' }: WidgetLoaderProps) {
  return (
    <div className={cn(styles.container, className, minHeight)}>
      <BrandedLoader size="small" />
    </div>
  )
} 