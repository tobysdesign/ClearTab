import { redirect } from 'next/navigation'

// The beta dashboard is now served at the root route. This redirect keeps
// any existing /beta links/bookmarks working.
export default function BetaDashboardPage() {
  redirect('/')
}
