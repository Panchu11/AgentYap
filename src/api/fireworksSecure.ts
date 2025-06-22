import { SecurityManager } from '../utils/security/encryption';

// Enhanced error handling and context validation for Fireworks AI
export async function fireworksAPI(prompt: string): Promise<string> {
  try {
    // Check if chrome extension context is still valid
    if (!chrome?.storage?.local) {
      throw new Error('Extension context invalidated. Please reload the page.')
    }

    // Get encrypted API key with timeout
    const apiKey = await Promise.race([
      SecurityManager.getSecureApiKey(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Storage access timeout')), 5000)
      )
    ]) as string;
    
    if (!apiKey) {
      throw new Error('API key not configured. Please set it in extension settings.')
    }

    // Validate API key format
    const validation = SecurityManager.validateApiKey(apiKey);
    if (!validation.isValid) {
      throw new Error(`Invalid API key: ${validation.errors.join(', ')}`)
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
            content: 'You are a crypto Twitter expert who writes authentic, engaging replies. Analyze the tweet content and identify specific crypto projects, people, or topics mentioned. Generate natural responses that include relevant handles (@), tickers ($), and hashtags (#) based on what you detect in the tweet. Write like a real person tweeting - casual, direct, and conversational. Keep responses under 280 characters and make them sound like genuine crypto Twitter interactions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.9,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid API key
        await SecurityManager.clearSecureApiKey();
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

    let reply = data.choices[0].message.content.trim()
    
    // Clean up the reply to remove quotes and formal language
    reply = reply
      .replace(/^(Reply:|Response:)\s*/i, '')
      .replace(/^["']|["']$/g, '') // Remove quotes at start/end
      .replace(/^@\w+\s+/, '') // Remove leading @ mentions that might be duplicated
      .trim()

    return reply
    
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

// Function to validate and store API key
export async function setFireworksApiKey(apiKey: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate API key format
    const validation = SecurityManager.validateApiKey(apiKey);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Test API key
    const test = await SecurityManager.testApiKey(apiKey);
    if (!test.isWorking) {
      return {
        success: false,
        error: test.error || 'API key validation failed'
      };
    }

    // Store encrypted API key
    const stored = await SecurityManager.storeSecureApiKey(apiKey);
    if (!stored) {
      return {
        success: false,
        error: 'Failed to store API key securely'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to check if API key is configured
export async function checkApiKeyConfigured(): Promise<boolean> {
  try {
    const apiKey = await SecurityManager.getSecureApiKey();
    return !!apiKey;
  } catch {
    return false;
  }
}

// Function to clear API key
export async function clearApiKey(): Promise<void> {
  await SecurityManager.clearSecureApiKey();
}
