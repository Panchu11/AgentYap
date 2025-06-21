import { getProjectMeta } from './getProjectMeta'
import { fireworksAPI } from '../api/fireworks'
import { getFallbackReply } from '../mock/fallbackReplies'

export async function generateReply(tweetText: string, tone: string): Promise<string> {
  // Declare projectMeta outside try block so it's accessible in catch
  let projectMeta: any
  
  try {
    // Detect project metadata from tweet
    projectMeta = getProjectMeta(tweetText)
    console.log('Detected project meta:', projectMeta)
    
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
    Smart: 'Write an analytical and insightful reply that shows deep understanding',
    Funny: 'Write a witty and entertaining reply with humor that fits crypto Twitter culture',
    Serious: 'Write a professional and direct reply that adds value to the conversation',
    Degen: 'Write a bold and crypto-native reply with appropriate slang and energy'
  }

  // Build specific context based on detected project
  let contextInstructions = ''
  
  if (projectMeta?.handle && projectMeta.handle !== 'twitter' && projectMeta.handle !== 'crypto') {
    // Specific project detected
    contextInstructions = `
- This tweet is about ${projectMeta.handle} specifically
- MUST include: @${projectMeta.handle}, $${projectMeta.ticker}, ${projectMeta.hashtags.join(' ')}
- Reference the specific project context and features mentioned in the tweet
- Show knowledge about ${projectMeta.handle} and its ecosystem
- Write like a genuine community member who understands the project`
  } else if (projectMeta?.handle === 'crypto') {
    // Generic crypto content
    contextInstructions = `
- This is general crypto/blockchain content
- Include: @crypto, $CRYPTO, ${projectMeta.hashtags.join(' ')}
- Use crypto Twitter terminology and culture
- Write like an experienced crypto native`
  } else {
    // Non-crypto content
    contextInstructions = `
- This is general social media content
- Include relevant hashtags: ${projectMeta?.hashtags?.join(' ') || '#discussion #social'}
- Keep it conversational and engaging
- DO NOT use crypto-specific terms unless the tweet is about crypto`
  }

  return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}${contextInstructions}
- Max 280 characters, natural, conversational tone
- Write like a real person tweeting, not a bot
- Be engaging and add value to the conversation
- ${tone === 'Degen' ? 'Use appropriate crypto slang and energy but keep it authentic' : ''}
- ${tone === 'Funny' ? 'Add humor that fits the context and crypto Twitter culture' : ''}
- CRITICAL: Always include the EXACT handles, tickers, and hashtags specified above
- NO quotes around the reply, write it as a direct tweet
- Sound like genuine crypto Twitter engagement, not corporate speak

Reply:`
}