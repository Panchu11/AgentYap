import { fireworksAPI } from '../api/fireworks'

export async function generateReply(tweetText: string, tone: string): Promise<string> {
  try {
    // Build the prompt with dynamic content detection
    const prompt = buildPrompt(tweetText, tone)
    
    // Try API call first
    try {
      const response = await fireworksAPI(prompt)
      return response
    } catch (apiError) {
      console.warn('API call failed, using fallback:', apiError)
      // Simple fallback without hardcoded content
      return generateSimpleFallback(tweetText, tone)
    }
  } catch (error) {
    console.error('Error in generateReply:', error)
    // Ultimate fallback
    return generateSimpleFallback(tweetText, tone)
  }
}

function buildPrompt(tweetText: string, tone: string): string {
  const instructions = {
    Smart: 'Write an analytical and insightful reply that shows deep understanding',
    Funny: 'Write a witty and entertaining reply with humor that fits the context',
    Serious: 'Write a professional and direct reply that adds value to the conversation',
    Degen: 'Write a bold and energetic reply with appropriate slang'
  }

  return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}
- Max 280 characters, natural, conversational tone
- Write like a real person tweeting, not a bot
- Be engaging and add value to the conversation
- Analyze the tweet content and determine appropriate:
  * Relevant handles/mentions to include (if any)
  * Appropriate ticker symbols (if crypto/finance related)
  * Relevant hashtags that fit the topic
- DO NOT use generic placeholders like @crypto or $CRYPTO
- Only include handles, tickers, and hashtags that are genuinely relevant to the tweet content
- If the tweet is about a specific project/person, mention them appropriately
- If it's general content, use relevant hashtags for the topic discussed
- ${tone === 'Degen' ? 'Use appropriate slang and energy but keep it authentic' : ''}
- ${tone === 'Funny' ? 'Add humor that fits the context and topic' : ''}
- NO quotes around the reply, write it as a direct tweet
- Sound like genuine engagement, not corporate speak

Reply:`
}

function generateSimpleFallback(tweetText: string, tone: string): string {
  const fallbacks = {
    Smart: [
      "Interesting perspective! This raises some important points worth considering.",
      "Great analysis! The data here is quite compelling.",
      "This aligns with what we've been seeing lately. Good insights!"
    ],
    Funny: [
      "This is the content I didn't know I needed today! 😂",
      "Plot twist: this is actually genius!",
      "My brain after reading this: 🤯 But seriously, great point!"
    ],
    Serious: [
      "This is an important development that deserves attention.",
      "The implications of this are worth considering carefully.",
      "This raises critical questions about the current landscape."
    ],
    Degen: [
      "This is the alpha we've been waiting for! 🚀",
      "LFG! This changes everything!",
      "Absolutely sending it! This is huge! 💎🙌"
    ]
  }

  const toneReplies = fallbacks[tone as keyof typeof fallbacks] || fallbacks.Smart
  return toneReplies[Math.floor(Math.random() * toneReplies.length)]
}