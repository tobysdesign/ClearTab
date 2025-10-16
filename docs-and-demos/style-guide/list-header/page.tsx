import { ListHeader } from '@/components/ui/list-header'
import { AddButton } from '@/components/ui/add-button'

export default function ListHeaderPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">List Header</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">With Add Button</h2>
          <div className="w-full rounded-md border mt-2">
            <ListHeader title="My List">
              <AddButton tooltip="Add new item" />
            </ListHeader>
            <div className="p-4">
              <p>List content goes here...</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Without Children</h2>
          <div className="w-full rounded-md border mt-2">
            <ListHeader title="Another List" />
            <div className="p-4">
              <p>List content goes here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 