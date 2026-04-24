import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AIProvider = 'openai' | 'gemini' | 'anthropic'

interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  systemPrompt?: string
  provider?: AIProvider
  modelId?: string
}

/** Appended to every system prompt so CMS / legacy copy cannot override with “split your reply” patterns. */
const OUTPUT_FORMAT_CONTRACT = `

---
User-visible reply format (must follow; overrides any conflicting line elsewhere in your instructions):
Write one natural, continuous message. Do not use square-bracket tags for layout or “parts” of an answer — for example never output [SPLIT], [PART], [SECTION], [SEGMENT], [BLOCK], [END], [TURN], or similar on their own line or inline. Use normal sentences and line breaks only.`

// Call OpenAI API using the new Responses API
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  modelId: string,
  apiKey: string
): Promise<string> {
  // Convert messages to new Responses API format
  const input: Array<{
    role: string
    content: string
  }> = []

  // Convert chat messages to new format
  for (const msg of messages) {
    input.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })
  }

  // Build request body with instructions for system prompt
  const requestBody: {
    model: string
    input: typeof input
    instructions?: string
    temperature?: number
    max_output_tokens?: number
  } = {
    model: modelId,
    input: input,
    temperature: 0.9,
    max_output_tokens: 8192,
  }

  // Add system instructions
  if (systemPrompt) {
    requestBody.instructions = systemPrompt
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let errorMessage = 'OpenAI API error'
    try {
      const errorData = await response.json()
      if (errorData.error) {
        // Extract the actual error message from OpenAI API response
        // OpenAI returns: { error: { message: "...", type: "...", code: "..." } }
        errorMessage = errorData.error.message || JSON.stringify(errorData.error)
      } else {
        errorMessage = JSON.stringify(errorData)
      }
    } catch (parseError) {
      // If JSON parsing fails, try to get text response
      try {
        const errorText = await response.text()
        errorMessage = errorText || `OpenAI API error (${response.status})`
      } catch {
        errorMessage = `OpenAI API error (${response.status})`
      }
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  // Log response structure for debugging
  console.log('OpenAI Response:', JSON.stringify(data, null, 2))
  
  // Try different possible response formats
  // The Responses API may return output in different fields
  let outputText: string | undefined
  
  // Check for output_text (SDK convenience property)
  if (data.output_text) {
    outputText = data.output_text
  }
  // Check for output array (common in new API)
  else if (Array.isArray(data.output)) {
    // Find the first message output with text content
    for (const item of data.output) {
      if (item.type === 'message' && item.content) {
        // Content might be array of parts
        if (Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === 'output_text' || part.type === 'text') {
              outputText = part.text
              break
            }
          }
        } else if (typeof item.content === 'string') {
          outputText = item.content
        }
        if (outputText) break
      }
      // Direct text in output item
      else if (item.text) {
        outputText = item.text
        break
      }
      else if (typeof item === 'string') {
        outputText = item
        break
      }
    }
  }
  // Check for choices array (legacy format)
  else if (data.choices?.[0]?.message?.content) {
    outputText = data.choices[0].message.content
  }
  // Simple field checks
  else if (data.text) {
    outputText = data.text
  }
  else if (data.content) {
    outputText = typeof data.content === 'string' ? data.content : data.content?.[0]?.text
  }
  else if (data.message) {
    outputText = typeof data.message === 'string' ? data.message : data.message?.content
  }
  
  if (!outputText) {
    console.error('Could not extract text from response. Full response:', JSON.stringify(data))
    return 'I apologize, but I could not generate a response.'
  }
  
  return outputText
}

// Call Gemini API
async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  modelId: string,
  apiKey: string
): Promise<{ message: string }> {
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
      maxOutputTokens: 4096,
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
        // Extract the actual error message from Gemini API response
        // Prioritize the message field, but provide helpful context for specific codes
        if (errorData.error.message) {
          errorMessage = errorData.error.message
        } else if (errorData.error.code === 503 || errorData.error.status === 'UNAVAILABLE') {
          errorMessage = 'The Gemini model is currently overloaded. Please try again in a moment or select a different model.'
        } else if (errorData.error.code === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (errorData.error.code === 401 || errorData.error.code === 403) {
          errorMessage = 'Authentication error. Please check your Gemini API key.'
        } else {
          errorMessage = JSON.stringify(errorData.error)
        }
      } else {
        errorMessage = JSON.stringify(errorData)
      }
    } catch (parseError) {
      // If JSON parsing fails, try to get text response
      try {
        const errorText = await response.text()
        errorMessage = errorText || `Gemini API error (${response.status})`
      } catch {
        errorMessage = `Gemini API error (${response.status})`
      }
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
      return { message: text }
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

// Call Anthropic Messages API (Claude)
async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  modelId: string,
  apiKey: string,
): Promise<string> {
  const turns = messages.filter((m) => m.role === 'user' || m.role === 'assistant')
  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const m of turns) {
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const last = anthropicMessages[anthropicMessages.length - 1]
    if (last && last.role === role) {
      last.content += '\n\n' + m.content
    } else {
      anthropicMessages.push({ role, content: m.content })
    }
  }

  if (anthropicMessages.length === 0) {
    throw new Error('No valid messages for Anthropic')
  }

  const body = {
    model: modelId,
    max_tokens: 8192,
    system: systemPrompt || 'You are a helpful assistant.',
    messages: anthropicMessages,
    temperature: 0.9,
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorMessage = 'Anthropic API error'
    try {
      const errData = await response.json()
      errorMessage = errData.error?.message || JSON.stringify(errData.error || errData)
    } catch {
      try {
        errorMessage = (await response.text()) || `Anthropic API error (${response.status})`
      } catch {
        errorMessage = `Anthropic API error (${response.status})`
      }
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  const blocks = data.content
  if (Array.isArray(blocks)) {
    const texts = blocks
      .filter((b: { type?: string }) => b.type === 'text')
      .map((b: { text?: string }) => b.text)
      .filter((t: string | undefined): t is string => typeof t === 'string' && t.length > 0)
    if (texts.length > 0) return texts.join('\n')
  }

  throw new Error('No response text from Anthropic API')
}

// Strip structural meta-tags if a model still emits them (must not remove [CONVERSATION_COMPLETE]).
const BRACKET_META_TAGS =
  /\s*\[(?:SPLIT|PART|SECTION|SEGMENTS?|BLOCK|END|TURN|RESPONSE_[AB]|SEGMENT_\d+)\]\s*/gi

function sanitizeModelMessage(text: string): string {
  let t = text.replace(BRACKET_META_TAGS, '\n\n')
  t = t.replace(/\n{3,}/g, '\n\n')
  return t.trim()
}

function withOutputContract(systemPrompt: string): string {
  return (systemPrompt || 'You are a helpful assistant.') + OUTPUT_FORMAT_CONTRACT
}

// Extract device info from request
function getDeviceInfoFromRequest(req: Request): {
  ip_address?: string
  user_agent?: string
  location?: string
} {
  const headers = req.headers
  const ipAddress = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    headers.get('x-real-ip') || 
                    'unknown'
  const userAgent = headers.get('user-agent') || 'unknown'
  
  // Try to get location from headers (if available from CDN/proxy)
  const location = headers.get('cf-ipcountry') || 
                   headers.get('x-vercel-ip-country') || 
                   undefined

  return {
    ip_address: ipAddress,
    user_agent: userAgent,
    location: location,
  }
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

    // Capture device info
    const deviceInfo = getDeviceInfoFromRequest(req)

    const systemWithContract = withOutputContract(systemPrompt || '')

    let aiMessage: string

    if (provider === 'gemini') {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiApiKey) {
        return new Response(
          JSON.stringify({ error: 'Gemini API key not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      const result = await callGemini(
        messages,
        systemWithContract,
        modelId,
        geminiApiKey
      )
      aiMessage = result.message
    } else if (provider === 'anthropic') {
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ error: 'Anthropic API key not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      aiMessage = await callAnthropic(
        messages,
        systemWithContract,
        modelId,
        anthropicApiKey,
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
        systemWithContract,
        modelId,
        openaiApiKey
      )
    }

    aiMessage = sanitizeModelMessage(aiMessage)

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        deviceInfo: deviceInfo // Include device info in response for client to save
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in chatbot function:', error)
    
    // Determine appropriate status code based on error type
    let statusCode = 500
    const errorMessage = error.message || 'Internal server error'
    
    // Check if it's a known API error
    if (errorMessage.includes('API key not configured')) {
      statusCode = 500
    } else if (errorMessage.includes('overloaded') || errorMessage.includes('Rate limit')) {
      statusCode = 503 // Service Unavailable
    } else if (errorMessage.includes('Authentication error') || errorMessage.includes('401') || errorMessage.includes('403')) {
      statusCode = 401 // Unauthorized
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
      statusCode = 400 // Bad Request
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: errorMessage // Include message for backward compatibility
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
    )
  }
})
