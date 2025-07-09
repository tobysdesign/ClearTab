import Image from 'next/image'

interface WidgetLoaderProps {
  className?: string
  minHeight?: string
}

export function WidgetLoader({ className = '', minHeight = 'min-h-[16rem]' }: WidgetLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className} animate-pulse`}>
      <div className="relative w-[60px] h-[50px]">
        <Image
          src="/assets/loading.gif"
          alt="Loading..."
          fill
          className="object-contain"
          sizes="60px"
          priority
        />
      </div>
    </div>
  )
} 