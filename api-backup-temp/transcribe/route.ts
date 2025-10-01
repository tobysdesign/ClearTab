import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

console.log('OpenAI API Key loaded:', !!process.env.OPENAI_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Create a form data object for OpenAI
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioFile)
    openaiFormData.append('model', 'whisper-1')

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    })

    return NextResponse.json({
      success: true,
      data: {
        text: transcription.text
      }
    })
  } catch (error: any) {
    console.error('Transcription error:', error)
    console.error('Error details:', error.message || error)
    
    // Check if it's an OpenAI API error
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data)
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}