import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConversationMessage {
  role: string
  content: string
}

interface ExtractionRequest {
  conversationId: string
  forceReExtract?: boolean
}

interface ExtractionResult {
  name: string | null
  age: number | null
  gender: string | null
  email: string | null
  case_summary: string
  recommendation: string
  chat_history: ConversationMessage[]
}

// Call Gemini API to extract information from conversation
async function extractWithGemini(
  conversationData: ConversationMessage[],
  apiKey: string,
  modelId: string = 'gemini-3-flash-preview'
): Promise<ExtractionResult> {
  const systemPrompt = `You are an expert data analyst. Your task is to analyze therapy chatbot conversations and extract key information.

Analyze the following conversation and extract:
1. User's name (if mentioned)
2. User's age (if mentioned or can be reasonably inferred)
3. User's gender (if mentioned or can be reasonably inferred)
4. User's email (if mentioned)
5. A concise summary of their case/situation (2-3 paragraphs)
6. Your professional recommendation for next steps

Respond ONLY with a valid JSON object in this exact format:
{
  "name": "string or null if not found",
  "age": number or null if not found,
  "gender": "string or null if not found",
  "email": "string or null if not found",
  "case_summary": "A detailed summary of the user's situation...",
  "recommendation": "Professional recommendations for next steps..."
}

Important:
- Only extract information that is explicitly stated or strongly implied
- For the summary, focus on mental health concerns, life circumstances, and presenting issues
- For recommendations, suggest appropriate professional resources or next steps
- Be empathetic but professional in your analysis
- Return ONLY the JSON object, no other text`

  // Format conversation for analysis
  const conversationText = conversationData
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n')

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `Please analyze this conversation and extract the requested information:\n\n${conversationText}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('No response from Gemini API')
  }

  const responseText = data.candidates[0].content.parts[0].text

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = responseText
  if (responseText.includes('```json')) {
    jsonStr = responseText.split('```json')[1].split('```')[0].trim()
  } else if (responseText.includes('```')) {
    jsonStr = responseText.split('```')[1].split('```')[0].trim()
  }

  try {
    const parsed = JSON.parse(jsonStr)
    return {
      name: parsed.name || null,
      age: typeof parsed.age === 'number' ? parsed.age : null,
      gender: parsed.gender || null,
      email: parsed.email || null,
      case_summary: parsed.case_summary || 'Unable to generate summary',
      recommendation: parsed.recommendation || 'No specific recommendations',
      chat_history: conversationData,
    }
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', responseText)
    throw new Error('Failed to parse extraction results from Gemini')
  }
}

// Internal analysis chat with Gemini
async function chatWithGemini(
  messages: Array<{ role: string; content: string }>,
  context: string,
  apiKey: string,
  modelId: string = 'gemini-3-flash-preview'
): Promise<string> {
  const systemPrompt = `You are an expert mental health data analyst with access to therapy chatbot conversation data. You help internal team members understand patterns, analyze cases, and derive insights from conversation data.

${context}

Guidelines:
- Be professional and analytical
- Protect user privacy - don't share identifying information unnecessarily
- Provide actionable insights
- When discussing specific cases, refer to anonymized identifiers when possible
- Be thorough but concise`

  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('No response from Gemini API')
  }

  return data.candidates[0].content.parts[0].text
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get auth header and verify user is internal
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's token and check if they're internal
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user is internal
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('is_internal')
      .eq('user_id', user.id)
      .single()

    if (roleError || !roleData?.is_internal) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Internal users only.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const body = await req.json()
    const action = body.action || 'extract'

    if (action === 'extract') {
      // Extract data from a specific conversation
      const { conversationId, forceReExtract } = body as ExtractionRequest

      if (!conversationId) {
        return new Response(
          JSON.stringify({ error: 'conversationId is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Check if we already have an extraction (unless force re-extract)
      if (!forceReExtract) {
        const { data: existing } = await supabase
          .from('conversation_extractions')
          .select('*')
          .eq('conversation_id', conversationId)
          .single()

        if (existing) {
          return new Response(
            JSON.stringify({ extraction: existing, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }

      // Fetch the conversation
      const { data: conversation, error: convError } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Extract information with Gemini
      const modelId = 'gemini-3-flash-preview'
      const extraction = await extractWithGemini(
        conversation.conversation_data as ConversationMessage[],
        geminiApiKey,
        modelId
      )

      // Save or update the extraction
      const extractionData = {
        conversation_id: conversationId,
        extracted_name: extraction.name,
        extracted_age: extraction.age,
        extracted_gender: extraction.gender,
        extracted_email: extraction.email,
        case_summary: extraction.case_summary,
        recommendation: extraction.recommendation,
        chat_history: extraction.chat_history,
        model_used: modelId,
        raw_extraction: extraction,
        extracted_at: new Date().toISOString(),
      }

      const { data: savedExtraction, error: saveError } = await supabase
        .from('conversation_extractions')
        .upsert(extractionData, { onConflict: 'conversation_id' })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving extraction:', saveError)
        return new Response(
          JSON.stringify({ error: 'Failed to save extraction', details: saveError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      return new Response(
        JSON.stringify({ extraction: savedExtraction, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } else if (action === 'chat') {
      // Chat with Gemini about conversation data
      const { messages, threadType, conversationId } = body

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: 'messages array is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      let context = ''

      if (threadType === 'specific' && conversationId) {
        // Load specific conversation and its extraction
        const { data: extraction } = await supabase
          .from('conversation_extractions')
          .select('*')
          .eq('conversation_id', conversationId)
          .single()

        const { data: conversation } = await supabase
          .from('chatbot_conversations')
          .select('*')
          .eq('id', conversationId)
          .single()

        if (extraction) {
          context = `You have access to the following extracted data about this conversation:
Name: ${extraction.extracted_name || 'Unknown'}
Age: ${extraction.extracted_age || 'Unknown'}
Gender: ${extraction.extracted_gender || 'Unknown'}
Email: ${extraction.extracted_email || 'Unknown'}

Case Summary:
${extraction.case_summary}

Recommendation:
${extraction.recommendation}

Original conversation:
${(extraction.chat_history as ConversationMessage[]).map(m => `${m.role}: ${m.content}`).join('\n')}`
        } else if (conversation) {
          context = `Original conversation (no extraction available):
${(conversation.conversation_data as ConversationMessage[]).map(m => `${m.role}: ${m.content}`).join('\n')}`
        }

      } else if (threadType === 'aggregate') {
        // Load aggregate data - summary statistics and recent extractions
        const { data: extractions } = await supabase
          .from('conversation_extractions')
          .select('*')
          .order('extracted_at', { ascending: false })
          .limit(50)

        const { count: totalConversations } = await supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })

        const { count: extractedCount } = await supabase
          .from('conversation_extractions')
          .select('*', { count: 'exact', head: true })

        // Build summary stats
        const genderCounts: Record<string, number> = {}
        const ages: number[] = []

        for (const ext of extractions || []) {
          if (ext.extracted_gender) {
            genderCounts[ext.extracted_gender] = (genderCounts[ext.extracted_gender] || 0) + 1
          }
          if (ext.extracted_age) {
            ages.push(ext.extracted_age)
          }
        }

        const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 'N/A'

        context = `You have access to aggregate data from the therapy chatbot:

Statistics:
- Total conversations: ${totalConversations}
- Analyzed conversations: ${extractedCount}
- Gender breakdown: ${JSON.stringify(genderCounts)}
- Average age (of those who provided): ${avgAge}

Recent case summaries (last 50 analyzed):
${(extractions || []).map((e, i) => `
Case ${i + 1}:
- Name: ${e.extracted_name || 'Anonymous'}
- Age: ${e.extracted_age || 'Unknown'}
- Gender: ${e.extracted_gender || 'Unknown'}
- Summary: ${e.case_summary}
- Recommendation: ${e.recommendation}
`).join('\n---\n')}`
      }

      const response = await chatWithGemini(messages, context, geminiApiKey)

      return new Response(
        JSON.stringify({ message: response }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "extract" or "chat"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in extract-conversation function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
