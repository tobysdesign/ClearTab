"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
      <Card className="w-full max-w-md p-6 shadow-lg border border-border flex flex-col items-center gap-4">
        <div className="relative w-[90px] h-[50px]">
          <Image
            src="/assets/loading.gif"
            alt="Loading..."
            fill
            className="object-contain"
            sizes="90px"
            priority
            unoptimized
          />
        </div>
      </Card>
    </div>
  )
} 