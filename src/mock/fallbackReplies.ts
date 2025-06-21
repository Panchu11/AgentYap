import fallbackData from './fallbackReplies.json'

export function getFallbackReply(tone: string, projectMeta: any): string {
  // Determine if this is crypto content
  const isCrypto = projectMeta?.handle === 'crypto' || 
                   ['Kaito', 'CreatorBid', 'solana', 'ethereum', 'bitcoin', 'DeFi', 'NFT'].includes(projectMeta?.handle)
  
  if (!isCrypto) {
    // Non-crypto fallback replies
    const nonCryptoReplies = {
      Smart: [
        "Interesting perspective! This could have significant implications. ${hashtags}",
        "Great analysis! The data supports this viewpoint. ${hashtags}",
        "This aligns with current trends we're seeing. ${hashtags}"
      ],
      Funny: [
        "Plot twist: this is actually genius! 😂 ${hashtags}",
        "My brain after reading this: 🤯 But seriously, great point! ${hashtags}",
        "Instructions unclear, but I'm here for it! 😄 ${hashtags}"
      ],
      Serious: [
        "This is an important development that deserves attention. ${hashtags}",
        "The implications of this are worth considering carefully. ${hashtags}",
        "This raises important questions about the current landscape. ${hashtags}"
      ],
      Degen: [
        "This is it! Time to go all in on this idea! 🚀 ${hashtags}",
        "Big brain energy right here! Let's gooo! 💪 ${hashtags}",
        "Absolutely sending it! This is the way! 🔥 ${hashtags}"
      ]
    }
    
    const replies = nonCryptoReplies[tone as keyof typeof nonCryptoReplies] || nonCryptoReplies.Smart
    const randomReply = replies[Math.floor(Math.random() * replies.length)]
    
    return randomReply.replace('${hashtags}', projectMeta?.hashtags?.join(' ') || '#discussion')
  }
  
  // Original crypto fallback logic
  const replies = fallbackData[tone as keyof typeof fallbackData] || fallbackData.Smart
  const randomReply = replies[Math.floor(Math.random() * replies.length)]
  
  // Replace placeholders with actual project data
  return randomReply
    .replace('@crypto', projectMeta?.handle ? `@${projectMeta.handle}` : '@crypto')
    .replace('@project', projectMeta?.handle ? `@${projectMeta.handle}` : '@project')
    .replace('$CRYPTO', projectMeta?.ticker ? `$${projectMeta.ticker}` : '$CRYPTO')
    .replace('$TOKEN', projectMeta?.ticker ? `$${projectMeta.ticker}` : '$TOKEN')
    .replace('#crypto', projectMeta?.hashtags?.[0] || '#crypto')
    .replace('#blockchain', projectMeta?.hashtags?.[1] || '#blockchain')
}