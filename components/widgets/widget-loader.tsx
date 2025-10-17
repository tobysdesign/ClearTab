import Image from 'next/image'
import { cn } from '@/lib/utils'
import styles from './widget-loader.module.css'

interface WidgetLoaderProps {
  className?: string
  minHeight?: string
}

export function WidgetLoader({ className = '', minHeight = 'min-h-[16rem]' }: WidgetLoaderProps) {
  return (
    <div className={cn(styles.container, className, minHeight)}>
      <div className={styles.imageContainer}>
        <Image
          src="/assets/loading.gif"
          alt="Loading..."
          fill
          className={styles.image}
          sizes="60px"
          priority
        />
      </div>
    </div>
  )
} 