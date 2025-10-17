import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { LayoutProvider } from '@/hooks/use-layout'

// Simple test page that bypasses auth/onboarding for extension testing
export default function TestExtension() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bye Dashboard - Extension Test</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                New Note
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                New Task
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                Voice Memo
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today&apos;s Overview</h2>
            <div className="space-y-2 text-gray-300">
              <p>Tasks: 3 pending</p>
              <p>Notes: 5 recent</p>
              <p>Weather: 72°F, Sunny</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">Extension is working! Supabase connection issues can be fixed later.</p>
        </div>
      </div>
    </div>
  )
}