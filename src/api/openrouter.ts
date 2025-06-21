// Remove hardcoded API key and use storage
export async function openRouterAPI(prompt: string): Promise<string> {
  try {
    // Get API key from Chrome storage
    const result = await chrome.storage.sync.get(['openrouterApiKey'])
    const apiKey = result.openrouterApiKey
    
    if (!apiKey) {
      throw new Error('API key not configured. Please set it in extension settings.')
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/Panchu11/AgentYap',
        'X-Title': 'AgentYap Chrome Extension'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
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
    return reply.replace(/^(Reply:|Response:)\s*/i, '').trim()
    
  } catch (error) {
    console.error('OpenRouter API error:', error)
    throw error
  }
}