import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    
    if (!authUser?.id) {
      return NextResponse.json({ connected: false })
    }

    const { data: userData, error } = await supabase
      .from('user')
      .select('google_calendar_connected')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Calendar status query error:', error)
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: userData?.google_calendar_connected || false
    })
  } catch (error) {
    console.error('Calendar status error:', error)
    return NextResponse.json({ connected: false })
  }
}