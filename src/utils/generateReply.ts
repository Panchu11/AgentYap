import { fireworksAPI } from '../api/fireworks'
import { getProjectMeta } from './getProjectMeta'

export async function generateReply(tweetText: string, tone: string, cryptoMode: boolean = true): Promise<string> {
  try {
    // Build the prompt with crypto mode consideration
    const prompt = buildPrompt(tweetText, tone, cryptoMode)
    
    // Try API call first
    try {
      const response = await fireworksAPI(prompt)
      return response
    } catch (apiError) {
      console.warn('API call failed, using fallback:', apiError)
      // Fallback with crypto mode consideration
      return generateSmartFallback(tweetText, tone, cryptoMode)
    }
  } catch (error) {
    console.error('Error in generateReply:', error)
    // Ultimate fallback
    return generateSmartFallback(tweetText, tone, cryptoMode)
  }
}

function buildPrompt(tweetText: string, tone: string, cryptoMode: boolean): string {
  const instructions = {
    Smart: cryptoMode ? 'Write an analytical and insightful crypto-focused reply that shows deep understanding' : 'Write an analytical and insightful reply that shows deep understanding',
    Funny: cryptoMode ? 'Write a witty and entertaining reply with crypto humor and memes' : 'Write a witty and entertaining reply with appropriate humor',
    Serious: cryptoMode ? 'Write a professional and direct crypto-focused reply that adds value' : 'Write a professional and direct reply that adds value to the conversation',
    Degen: cryptoMode ? 'Write a bold and energetic reply with crypto slang and energy' : 'Write a bold and energetic reply with appropriate slang'
  }

  if (cryptoMode) {
    return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}
- Max 280 characters, natural, conversational tone
- Write like a real crypto Twitter user, not a bot
- Be engaging and add crypto perspective to the conversation
- CRITICAL: Analyze the tweet content and identify:
  * Specific crypto projects mentioned (Bitcoin, Ethereum, Solana, Humanity Protocol, etc.)
  * People or influencers mentioned (@handles)
  * Relevant ticker symbols ($BTC, $ETH, $SOL, $HMT, etc.)
  * Appropriate crypto hashtags (#Bitcoin, #DeFi, #NFT, #HumanityProtocol, etc.)
- ALWAYS include relevant mentions, tickers, and hashtags based on what's discussed
- If the tweet mentions a specific crypto project, MUST include their official handle and ticker
- If it's about DeFi, include relevant DeFi hashtags and mentions
- If it's about NFTs, include NFT-related hashtags and mentions
- If it's about a specific blockchain, mention that blockchain's official accounts
- ${tone === 'Degen' ? 'Use crypto slang like "LFG", "WAGMI", "diamond hands", "ape", "moon" but keep it authentic' : ''}
- ${tone === 'Funny' ? 'Add crypto humor, memes, and references that fit crypto Twitter culture' : ''}
- NO quotes around the reply, write it as a direct tweet
- Sound like genuine crypto Twitter engagement, not corporate speak
- MUST include specific project mentions, tickers ($), and hashtags (#) when relevant
- Connect the tweet topic to crypto/Web3 perspective naturally

Reply:`
  } else {
    return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}
- Max 280 characters, natural, conversational tone
- Write like a real person tweeting, not a bot
- Be engaging and add value to the conversation
- Focus on the actual topic without forcing crypto references
- Use appropriate hashtags related to the actual topic discussed
- ${tone === 'Degen' ? 'Use energetic language and slang but keep it appropriate' : ''}
- ${tone === 'Funny' ? 'Add humor and wit that fits the conversation' : ''}
- NO quotes around the reply, write it as a direct tweet
- Sound like genuine social media engagement
- Stay on topic and provide meaningful response

Reply:`
  }
}

function generateSmartFallback(tweetText: string, tone: string, cryptoMode: boolean): string {
  if (cryptoMode) {
    // Get project metadata for crypto-specific fallbacks
    const projectMeta = getProjectMeta(tweetText)
    
    const cryptoFallbacks = {
      Smart: [
        `Interesting perspective! ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'This could have major implications for the crypto space #crypto #blockchain'}`,
        `Great analysis! ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'The fundamentals here look solid for Web3 adoption #Web3 #crypto'}`,
        `This aligns with what we're seeing in crypto. ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'Bullish for the entire ecosystem #crypto #DeFi'}`
      ],
      Funny: [
        `My portfolio after reading this: 📈📉📈📉 ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'But seriously, this is alpha! #crypto #memes'}`,
        `Plot twist: this is actually bullish for crypto! 😂 ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : '#crypto #WAGMI'}`,
        `Instructions unclear, bought more crypto 🚀 ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : '#HODL #crypto'}`
      ],
      Serious: [
        `This is a critical development for the space. ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'Important implications for crypto adoption #crypto #blockchain'}`,
        `The implications for Web3 are significant. ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'This deserves careful analysis #Web3 #crypto'}`,
        `Market participants should monitor this closely. ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : 'Critical for the ecosystem #crypto #DeFi'}`
      ],
      Degen: [
        `LFG! This is the alpha we've been waiting for! 🚀 ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : '#ToTheMoon #WAGMI'}`,
        `Ape mode activated! Time to send it! 🦍💎 ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : '#DiamondHands #crypto'}`,
        `This is it chief! All in! 🚀💎🙌 ${projectMeta.handle ? `@${projectMeta.handle} ${projectMeta.ticker ? `$${projectMeta.ticker}` : ''} ${projectMeta.hashtags[0] || '#crypto'}` : '#WAGMI #ToTheMoon'}`
      ]
    }
    
    const toneReplies = cryptoFallbacks[tone as keyof typeof cryptoFallbacks] || cryptoFallbacks.Smart
    return toneReplies[Math.floor(Math.random() * toneReplies.length)]
  } else {
    // Non-crypto fallbacks
    const regularFallbacks = {
      Smart: [
        'Interesting perspective! This raises some important points worth considering.',
        'Great analysis! The insights here are quite compelling.',
        'This aligns with current trends. Good observations!'
      ],
      Funny: [
        'This is the content I didn\'t know I needed! 😂',
        'Plot twist: this is actually genius!',
        'My brain after reading this: 🤯 But seriously, great point!'
      ],
      Serious: [
        'This is an important development that deserves attention.',
        'The implications of this are worth considering carefully.',
        'This raises critical questions about the current landscape.'
      ],
      Degen: [
        'This is it! Absolutely sending it! 🚀',
        'Full send mode activated! Let\'s go! 💪',
        'This hits different! All the way! 🔥'
      ]
    }
    
    const toneReplies = regularFallbacks[tone as keyof typeof regularFallbacks] || regularFallbacks.Smart
    return toneReplies[Math.floor(Math.random() * toneReplies.length)]
  }
}