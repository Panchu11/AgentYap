import fallbackData from './fallbackReplies.json'

export function getFallbackReply(tone: string, projectMeta: any): string {
  // If we have specific project metadata, create a targeted fallback
  if (projectMeta?.handle && projectMeta.handle !== 'twitter' && projectMeta.handle !== 'crypto') {
    const specificReplies = {
      Smart: [
        `Interesting development! Looking forward to seeing how this evolves. @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `Great analysis! The fundamentals here look solid. @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `This aligns with what we've been seeing in the space. @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`
      ],
      Funny: [
        `My brain after reading this: 🤯 But seriously, great point! @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `Plot twist: this is actually genius! 😂 @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `Instructions unclear, but I'm here for it! 😄 @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`
      ],
      Serious: [
        `This is an important development that deserves attention. @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `The implications of this are worth considering carefully. @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `This raises important questions about the current landscape. @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`
      ],
      Degen: [
        `LFG! This is the alpha we've been waiting for! 🚀 @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `Ape mode activated! Time to send it! 🦍💎 @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`,
        `This is it chief! All in! 🚀💎🙌 @${projectMeta.handle} $${projectMeta.ticker} ${projectMeta.hashtags[0]}`
      ]
    }
    
    const replies = specificReplies[tone as keyof typeof specificReplies] || specificReplies.Smart
    return replies[Math.floor(Math.random() * replies.length)]
  }
  
  // Use the original fallback system for generic content
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