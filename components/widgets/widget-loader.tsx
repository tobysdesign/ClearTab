import { Card } from '@/components/ui/card'
import Image from 'next/image'

interface WidgetLoaderProps {
  className?: string
  minHeight?: string
}

export function WidgetLoader({ className = '', minHeight = 'min-h-[16rem]' }: WidgetLoaderProps) {
  return (
    <Card className={`dashCard flex items-center justify-center ${minHeight} ${className} animate-pulse`}>
      <div className="relative w-[90px] h-[50px]">
        <Image
          src="/assets/looading.gif"
          alt="Loading..."
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
    </Card>
  )
} 