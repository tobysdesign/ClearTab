'use client'

import { AddButton } from '@/components/ui/add-button'

export default function AddButtonPage() {
  return (
    <div className="p-8 max-w-sm mx-auto flex flex-col items-center space-y-8">
      <h1 className="text-2xl font-bold mb-8">Add Button Component</h1>

      <div>
        <h2 className="text-lg font-semibold mb-4 text-center">
          Standard Add Button
        </h2>
        <AddButton />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 text-center">
          Add Button with Tooltip
        </h2>
        <AddButton tooltip="Click to add a new item" />
      </div>
    </div>
  )
} 