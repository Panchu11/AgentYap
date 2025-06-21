// Enhanced error handling and context validation for Fireworks AI
export async function fireworksAPI(prompt: string): Promise<string> {
  try {
    // Check if chrome extension context is still valid
    if (!chrome?.storage?.sync) {
      throw new Error('Extension context invalidated. Please reload the page.')
    }

    // Get API key from Chrome storage with timeout
    const result = await Promise.race([
      chrome.storage.sync.get(['fireworksApiKey']),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Storage access timeout')), 5000)
      )
    ]) as { fireworksApiKey?: string }
    
    const apiKey = result.fireworksApiKey
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key not configured. Please set it in extension settings.')
    }

    // Validate API key format for Fireworks
    if (!apiKey.startsWith('fw_')) {
      throw new Error('Invalid API key format. Please check your Fireworks API key.')
    }

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
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
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Fireworks API key in settings.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      } else if (response.status >= 500) {
        throw new Error('Fireworks service temporarily unavailable. Please try again.')
      } else {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format')
    }

    const reply = data.choices[0].message.content.trim()
    return reply.replace(/^(Reply:|Response:)\s*/i, '').trim()
    
  } catch (error) {
    console.error('Fireworks API error:', error)
    
    // Re-throw with more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Extension context invalidated')) {
        throw new Error('Extension was reloaded. Please refresh the page and try again.')
      } else if (error.message.includes('Storage access timeout')) {
        throw new Error('Extension storage access failed. Please refresh the page.')
      }
      throw error
    }
    
    throw new Error('Unknown error occurred while generating reply')
  }
}