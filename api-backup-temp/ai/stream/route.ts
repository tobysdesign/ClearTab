import { NextRequest } from 'next/server'
import { getChatCompletion } from '@/server/llm'

export async function POST(request: NextRequest) {
  try {
    const { prompt, hasSeenOnboarding, userName, agentName } = await request.json()

    // Create a readable stream for NDJSON response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        // Send thinking status
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'thinking',
          content: 'Processing your message...'
        }) + '\n'))

        try {
          // Get streaming response from OpenAI
          const completion = await getChatCompletion({
            model: 'gpt-4o',
            messages: [
              { 
                role: 'system', 
                content: `You are ${agentName || 'a helpful assistant'}. You are talking to ${userName || 'a user'}. 

IMPORTANT: Never use hashtags (#) in your responses. The user has a separate command system that uses hashtags like #task and #note, but you should NEVER include these in your responses as they will be interpreted as commands.

Think step by step about your response and provide helpful, clear answers without using hashtags.` 
              },
              { role: 'user', content: prompt }
            ],
            stream: true,
          })

          // Send thinking phases
          const thinkingSteps = [
            'Understanding your request...',
            'Analyzing context...',
            'Formulating response...',
            'Finalizing answer...'
          ]

          for (let i = 0; i < thinkingSteps.length; i++) {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'thinking',
              content: thinkingSteps[i],
              step: i + 1,
              totalSteps: thinkingSteps.length
            }) + '\n'))
            
            // Add small delay between thinking steps
            await new Promise(resolve => setTimeout(resolve, 300))
          }

          // Stream the actual response
          let fullResponse = ''
          
          for await (const chunk of completion as any) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              fullResponse += content
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'content',
                content: content,
                fullContent: fullResponse
              }) + '\n'))
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'complete',
            fullContent: fullResponse
          }) + '\n'))

        } catch (error) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            content: 'Failed to process your message. Please try again.'
          }) + '\n'))
        }

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Streaming error:', error)
    return new Response(JSON.stringify({ error: 'Failed to start stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}