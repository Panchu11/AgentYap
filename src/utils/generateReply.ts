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
    return `Great point! ${projectMeta?.handle ? `@${projectMeta.handle}` : ''} ${projectMeta?.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta?.hashtags?.[0] || '#crypto'}`
  }
}

function buildPrompt(tweetText: string, tone: string, projectMeta: any): string {
  const instructions = {
    Smart: 'Write an analytical and insightful reply',
    Funny: 'Write a witty and entertaining reply with humor',
    Serious: 'Write a professional and direct reply',
    Degen: 'Write a bold and crypto-native reply with slang and emojis'
  }

  return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}
- Include: ${projectMeta?.handle ? `@${projectMeta.handle}` : '@project'}, ${projectMeta?.ticker ? `$${projectMeta.ticker}` : '$TOKEN'}, ${projectMeta?.hashtags?.join(' ') || '#crypto #web3'}
- Max 280 characters, natural, bold CT tone
- Be authentic and engaging
- ${tone === 'Degen' ? 'Use crypto slang and rocket emojis' : ''}
- ${tone === 'Funny' ? 'Add humor but keep it relevant' : ''}

Reply:`
}