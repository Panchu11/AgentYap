import { getProjectMeta } from './getProjectMeta'
import { fireworksAPI } from '../api/fireworks'
import { getFallbackReply } from '../mock/fallbackReplies'

export async function generateReply(tweetText: string, tone: string): Promise<string> {
  // Declare projectMeta outside try block so it's accessible in catch
  let projectMeta: any
  
  try {
    // Detect project metadata from tweet
    projectMeta = getProjectMeta(tweetText)
    
    // Build the prompt with better context awareness
    const prompt = buildPrompt(tweetText, tone, projectMeta)
    
    // Try API call first
    try {
      const response = await fireworksAPI(prompt)
      return response
    } catch (apiError) {
      console.warn('API call failed, using fallback:', apiError)
      // Use fallback reply if API fails
      return getFallbackReply(tone, projectMeta)
    }
  } catch (error) {
    console.error('Error in generateReply:', error)
    // Ultimate fallback - projectMeta is now accessible here
    return `Great point! ${projectMeta?.handle ? `@${projectMeta.handle}` : ''} ${projectMeta?.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta?.hashtags?.[0] || '#discussion'}`
  }
}

function buildPrompt(tweetText: string, tone: string, projectMeta: any): string {
  const instructions = {
    Smart: 'Write an analytical and insightful reply',
    Funny: 'Write a witty and entertaining reply with humor',
    Serious: 'Write a professional and direct reply',
    Degen: 'Write a bold and crypto-native reply with slang and emojis'
  }

  // Determine if this is crypto content
  const isCrypto = projectMeta?.handle === 'crypto' || 
                   ['Kaito', 'CreatorBid', 'solana', 'ethereum', 'bitcoin', 'DeFi', 'NFT'].includes(projectMeta?.handle)

  // Build context-aware prompt
  let contextInstructions = ''
  if (isCrypto) {
    contextInstructions = `
- This is crypto/blockchain related content
- Include: ${projectMeta?.handle ? `@${projectMeta.handle}` : '@crypto'}, ${projectMeta?.ticker ? `$${projectMeta.ticker}` : '$CRYPTO'}, ${projectMeta?.hashtags?.join(' ') || '#crypto #web3'}
- Use crypto Twitter terminology and tone`
  } else {
    contextInstructions = `
- This is general social media content (not crypto-specific)
- Include relevant handles and hashtags: ${projectMeta?.hashtags?.join(' ') || '#discussion #social'}
- Keep it conversational and engaging
- DO NOT use crypto-specific terms, tickers, or hashtags unless the original tweet is about crypto`
  }

  return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}${contextInstructions}
- Max 280 characters, natural tone
- Be authentic and engaging
- ${tone === 'Degen' && isCrypto ? 'Use crypto slang and rocket emojis' : ''}
- ${tone === 'Funny' ? 'Add humor but keep it relevant' : ''}
- Match the topic and tone of the original tweet

Reply:`
}