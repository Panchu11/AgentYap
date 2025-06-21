import fallbackData from './fallbackReplies.json'

export function getFallbackReply(tone: string, projectMeta: any): string {
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