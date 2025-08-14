import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Not Found</h2>
        <p className="text-muted-foreground">
          Could not find the requested resource
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/">
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 