'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WidgetPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Widget Component</h1>
      <p className="mb-8 text-muted-foreground">
        Widgets are built using the Card component as a base. They should
        typically include a CardHeader with a title and an optional action, and
        CardContent for the main body.
      </p>

      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Generic Widget Title</CardTitle>
              <CardDescription>
                A short description for the widget.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </CardHeader>
          <CardContent>
            <p>This is the main content area of the widget.</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">Widget footer text</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 