import { fireworksAPI } from '../api/fireworks'

export async function rewriteReply(originalReply: string): Promise<string> {
  try {
    const prompt = `Original reply: "${originalReply}"

Instructions:
- Rephrase this reply differently while keeping the same meaning
- Keep all hashtags, handles (@), and ticker symbols ($) exactly the same
- Maintain the same tone and style
- Max 280 characters
- Make it sound fresh and natural

Rewritten reply:`

    const response = await fireworksAPI(prompt)
    return response
  } catch (error) {
    console.error('Error rewriting reply:', error)
    
    // Simple fallback rewrite
    const variations = [
      'Absolutely! ',
      'This! ',
      'Exactly! ',
      'So true! ',
      'Facts! '
    ]
    
    const randomPrefix = variations[Math.floor(Math.random() * variations.length)]
    return randomPrefix + originalReply.replace(/^(Great|Amazing|Awesome|Nice|Cool)/, '').trim()
  }
}