const API_KEY = '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'
const MODEL_ID = 'google/gemini-2.0-flash-exp:free'
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function openRouterAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/Panchu11/AgentYap',
        'X-Title': 'AgentYap Chrome Extension'
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: 'system',
            content: 'You are a crypto Twitter expert. Generate authentic, engaging replies that sound natural and human. Always include the requested handles, tickers, and hashtags. Keep responses under 280 characters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format')
    }

    const reply = data.choices[0].message.content.trim()
    
    // Clean up the reply (remove "Reply:" prefix if present)
    return reply.replace(/^(Reply:|Response:)\s*/i, '').trim()
    
  } catch (error) {
    console.error('OpenRouter API error:', error)
    throw error
  }
}