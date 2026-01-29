import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AIProvider = 'openai' | 'gemini'

interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  systemPrompt?: string
  provider?: AIProvider
  modelId?: string
}

// Call OpenAI API
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  modelId: string,
  apiKey: string
): Promise<string> {
  // GPT-5 models use max_completion_tokens and don't support custom temperature
  // They only support the default temperature value (1)
  const requestBody = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_completion_tokens: 1000,
    // Do not include temperature - GPT-5 models only support default (1)
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
}

// Call Gemini API
async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  modelId: string,
  apiKey: string
): Promise<string> {
  // Convert messages to Gemini format
  // Gemini uses different role names: 'user' and 'model' (instead of 'assistant')
  // We need to build a conversation history
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
  
  // Gemini 3 models support system instructions directly
  const isGemini3 = modelId.includes('gemini-3')
  
  interface GeminiRequest {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>
    systemInstruction?: { parts: Array<{ text: string }> }
    generationConfig: {
      temperature: number
      maxOutputTokens: number
    }
  }
  
  // Build request body
  const requestBody: GeminiRequest = {
    contents: [],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  }

  // Add system instruction for Gemini 3 models
  if (isGemini3 && systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    }
  } else if (systemPrompt) {
    // For older models, add system prompt as first user message
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    })
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will help you with that.' }],
    })
  }

  // Convert chat messages to Gemini format
  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user'
    contents.push({
      role: role,
      parts: [{ text: msg.content }],
    })
  }

  requestBody.contents = contents

  // Use the generateContent endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let errorMessage = 'Gemini API error'
    try {
      const errorData = await response.json()
      if (errorData.error) {
        // Handle specific error codes
        if (errorData.error.code === 503 || errorData.error.status === 'UNAVAILABLE') {
          errorMessage = 'The Gemini model is currently overloaded. Please try again in a moment or select a different model.'
        } else if (errorData.error.code === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (errorData.error.code === 401 || errorData.error.code === 403) {
          errorMessage = 'Authentication error. Please check your Gemini API key.'
        } else {
          errorMessage = errorData.error.message || `Gemini API error: ${JSON.stringify(errorData.error)}`
        }
      } else {
        errorMessage = `Gemini API error: ${JSON.stringify(errorData)}`
      }
    } catch (parseError) {
      const errorText = await response.text()
      errorMessage = `Gemini API error (${response.status}): ${errorText}`
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  // Check for errors in response
  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
  }
  
  // Handle response format
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const text = data.candidates[0].content.parts?.[0]?.text
    if (text) {
      return text
    }
  }
  
  // Check for blocked or filtered responses
  if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
    const finishReason = data.candidates[0].finishReason
    if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
      throw new Error('The response was blocked by safety filters. Please try rephrasing your request.')
    }
  }
  
  // Fallback error message
  throw new Error('No response text found in Gemini API response')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, systemPrompt, provider = 'openai', modelId = 'gpt-5.2' }: ChatRequest = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let aiMessage: string

    if (provider === 'gemini') {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiApiKey) {
        return new Response(
          JSON.stringify({ error: 'Gemini API key not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      aiMessage = await callGemini(
        messages,
        systemPrompt || 'You are a helpful assistant.',
        modelId,
        geminiApiKey
      )
    } else {
      // Default to OpenAI
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiApiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      aiMessage = await callOpenAI(
        messages,
        systemPrompt || 'You are a helpful assistant.',
        modelId,
        openaiApiKey
      )
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in chatbot function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
