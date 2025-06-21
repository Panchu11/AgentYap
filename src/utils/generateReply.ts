import { fireworksAPI } from '../api/fireworks'

export async function generateReply(tweetText: string, tone: string): Promise<string> {
  try {
    // Build the prompt with enhanced crypto project detection
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
    Funny: 'Write a witty and entertaining reply with humor that fits crypto Twitter culture',
    Serious: 'Write a professional and direct reply that adds value to the conversation',
    Degen: 'Write a bold and energetic reply with appropriate crypto slang and energy'
  }

  return `Tweet: "${tweetText}"

Instructions:
- ${instructions[tone as keyof typeof instructions]}
- Max 280 characters, natural, conversational tone
- Write like a real person tweeting, not a bot
- Be engaging and add value to the conversation
- CRITICAL: Analyze the tweet content and identify:
  * Specific crypto projects mentioned (Bitcoin, Ethereum, Solana, etc.)
  * People or influencers mentioned (@handles)
  * Relevant ticker symbols ($BTC, $ETH, $SOL, etc.)
  * Appropriate hashtags for the topic (#Bitcoin, #DeFi, #NFT, etc.)
- Include relevant mentions, tickers, and hashtags based on what's actually discussed
- If the tweet mentions a specific crypto project, include their official handle and ticker
- If it's about DeFi, include relevant DeFi hashtags and mentions
- If it's about NFTs, include NFT-related hashtags and mentions
- If it's about a specific blockchain, mention that blockchain's official accounts
- ${tone === 'Degen' ? 'Use appropriate crypto slang like "LFG", "WAGMI", "diamond hands" but keep it authentic' : ''}
- ${tone === 'Funny' ? 'Add humor that fits crypto Twitter culture and memes' : ''}
- NO quotes around the reply, write it as a direct tweet
- Sound like genuine crypto Twitter engagement, not corporate speak
- Make sure to include specific project mentions and tickers when relevant

Reply:`
}

function generateSimpleFallback(tweetText: string, tone: string): string {
  // Analyze tweet for crypto keywords to determine appropriate fallback
  const cryptoKeywords = {
    bitcoin: { handle: '@bitcoin', ticker: '$BTC', hashtags: '#Bitcoin #BTC' },
    ethereum: { handle: '@ethereum', ticker: '$ETH', hashtags: '#Ethereum #ETH' },
    solana: { handle: '@solana', ticker: '$SOL', hashtags: '#Solana #SOL' },
    defi: { handle: '@DeFi', ticker: '$DeFi', hashtags: '#DeFi #DecentralizedFinance' },
    nft: { handle: '@NFT', ticker: '$NFT', hashtags: '#NFT #NFTs' }
  }

  const lowerTweet = tweetText.toLowerCase()
  let projectMeta = null

  // Detect project from tweet content
  for (const [keyword, meta] of Object.entries(cryptoKeywords)) {
    if (lowerTweet.includes(keyword)) {
      projectMeta = meta
      break
    }
  }

  const fallbacks = {
    Smart: [
      `Interesting perspective! ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'This raises important points worth considering.'}`,
      `Great analysis! ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'The data here is quite compelling.'}`,
      `This aligns with recent trends. ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'Good insights!'}`
    ],
    Funny: [
      `This is the alpha I didn't know I needed! 😂 ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : ''}`,
      `Plot twist: this is actually genius! ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : ''}`,
      `My brain after reading this: 🤯 ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'But seriously, great point!'}`
    ],
    Serious: [
      `This is an important development. ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'Deserves careful consideration.'}`,
      `The implications are significant. ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'Worth monitoring closely.'}`,
      `Critical insights here. ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : 'This changes the landscape.'}`
    ],
    Degen: [
      `LFG! This is the alpha we've been waiting for! 🚀 ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : '#WAGMI'}`,
      `Ape mode activated! Time to send it! 🦍💎 ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : '#DiamondHands'}`,
      `This is it chief! All in! 🚀💎🙌 ${projectMeta ? `${projectMeta.handle} ${projectMeta.ticker} ${projectMeta.hashtags}` : '#ToTheMoon'}`
    ]
  }

  const toneReplies = fallbacks[tone as keyof typeof fallbacks] || fallbacks.Smart
  return toneReplies[Math.floor(Math.random() * toneReplies.length)]
}