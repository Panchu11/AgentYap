interface ProjectMeta {
  handle: string
  ticker: string
  hashtags: string[]
}

const PROJECT_MAPPING: Record<string, ProjectMeta> = {
  'kaito': {
    handle: 'Kaito',
    ticker: 'KAITO',
    hashtags: ['#KaitoYap', '#AIAlpha', '#CTTools']
  },
  'creatorbid': {
    handle: 'CreatorBid',
    ticker: 'BID',
    hashtags: ['#CreatorBid', '#BidVerse', '#SniperAI']
  },
  'solana': {
    handle: 'solana',
    ticker: 'SOL',
    hashtags: ['#Solana', '#SOL', '#SolanaEcosystem']
  },
  'ethereum': {
    handle: 'ethereum',
    ticker: 'ETH',
    hashtags: ['#Ethereum', '#ETH', '#DeFi']
  },
  'bitcoin': {
    handle: 'bitcoin',
    ticker: 'BTC',
    hashtags: ['#Bitcoin', '#BTC', '#HODL']
  },
  'ai': {
    handle: 'AI',
    ticker: 'AI',
    hashtags: ['#AI', '#ArtificialIntelligence', '#MachineLearning']
  },
  'defi': {
    handle: 'DeFi',
    ticker: 'DEFI',
    hashtags: ['#DeFi', '#DecentralizedFinance', '#Yield']
  },
  'nft': {
    handle: 'NFT',
    ticker: 'NFT',
    hashtags: ['#NFT', '#NFTs', '#DigitalArt']
  },
  // Add more general topics
  'tech': {
    handle: 'tech',
    ticker: 'TECH',
    hashtags: ['#tech', '#technology', '#innovation']
  },
  'startup': {
    handle: 'startup',
    ticker: 'STARTUP',
    hashtags: ['#startup', '#entrepreneur', '#business']
  },
  'finance': {
    handle: 'finance',
    ticker: 'FIN',
    hashtags: ['#finance', '#investing', '#markets']
  },
  'sports': {
    handle: 'sports',
    ticker: 'SPORT',
    hashtags: ['#sports', '#athletics', '#competition']
  },
  'music': {
    handle: 'music',
    ticker: 'MUSIC',
    hashtags: ['#music', '#artist', '#entertainment']
  },
  'gaming': {
    handle: 'gaming',
    ticker: 'GAME',
    hashtags: ['#gaming', '#esports', '#gamer']
  }
}

// Keywords that indicate crypto-related content
const CRYPTO_KEYWORDS = [
  'crypto', 'bitcoin', 'ethereum', 'blockchain', 'defi', 'nft', 'token', 'coin',
  'trading', 'hodl', 'degen', 'ape', 'moon', 'diamond hands', 'web3', 'dao',
  'yield', 'staking', 'mining', 'wallet', 'exchange', 'altcoin', 'memecoin'
]

export function getProjectMeta(tweetText: string): ProjectMeta | null {
  const lowerText = tweetText.toLowerCase()
  
  // First, check if this is actually crypto-related content
  const isCryptoRelated = CRYPTO_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
  
  // Check for ticker symbols (strong indicator of crypto)
  const tickerMatches = tweetText.match(/\$([A-Z]{2,10})/g)
  const hasCryptoTickers = tickerMatches && tickerMatches.some(ticker => {
    const symbol = ticker.substring(1)
    return Object.values(PROJECT_MAPPING).some(meta => meta.ticker === symbol)
  })
  
  // Check for crypto @ mentions
  const mentionMatches = tweetText.match(/@(\w+)/g)
  const hasCryptoMentions = mentionMatches && mentionMatches.some(mention => {
    const handle = mention.substring(1)
    return Object.values(PROJECT_MAPPING).some(meta => 
      meta.handle.toLowerCase() === handle.toLowerCase() && 
      ['kaito', 'creatorbid', 'solana', 'ethereum', 'bitcoin', 'ai', 'defi', 'nft'].includes(
        Object.keys(PROJECT_MAPPING).find(key => PROJECT_MAPPING[key].handle.toLowerCase() === handle.toLowerCase()) || ''
      )
    )
  })
  
  // If it's clearly crypto-related, proceed with crypto detection
  if (isCryptoRelated || hasCryptoTickers || hasCryptoMentions) {
    // Check for exact crypto project matches first
    for (const [keyword, meta] of Object.entries(PROJECT_MAPPING)) {
      // Only check crypto-related projects
      if (['kaito', 'creatorbid', 'solana', 'ethereum', 'bitcoin', 'ai', 'defi', 'nft'].includes(keyword)) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return meta
        }
      }
    }
    
    // Check for ticker symbols
    if (tickerMatches) {
      for (const ticker of tickerMatches) {
        const symbol = ticker.substring(1)
        for (const meta of Object.values(PROJECT_MAPPING)) {
          if (meta.ticker === symbol) {
            return meta
          }
        }
      }
    }
    
    // Check for @ mentions
    if (mentionMatches) {
      for (const mention of mentionMatches) {
        const handle = mention.substring(1)
        for (const meta of Object.values(PROJECT_MAPPING)) {
          if (meta.handle.toLowerCase() === handle.toLowerCase()) {
            return meta
          }
        }
      }
    }
    
    // Default crypto fallback
    return {
      handle: 'crypto',
      ticker: 'CRYPTO',
      hashtags: ['#crypto', '#web3', '#blockchain']
    }
  }
  
  // For non-crypto content, try to detect other topics
  for (const [keyword, meta] of Object.entries(PROJECT_MAPPING)) {
    // Only check non-crypto topics
    if (['tech', 'startup', 'finance', 'sports', 'music', 'gaming'].includes(keyword)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return meta
      }
    }
  }
  
  // Check for general topic indicators
  if (lowerText.includes('startup') || lowerText.includes('entrepreneur') || lowerText.includes('business')) {
    return PROJECT_MAPPING.startup
  }
  
  if (lowerText.includes('technology') || lowerText.includes('software') || lowerText.includes('coding')) {
    return PROJECT_MAPPING.tech
  }
  
  if (lowerText.includes('investing') || lowerText.includes('stocks') || lowerText.includes('market')) {
    return PROJECT_MAPPING.finance
  }
  
  if (lowerText.includes('game') || lowerText.includes('esports') || lowerText.includes('gaming')) {
    return PROJECT_MAPPING.gaming
  }
  
  if (lowerText.includes('music') || lowerText.includes('song') || lowerText.includes('artist')) {
    return PROJECT_MAPPING.music
  }
  
  if (lowerText.includes('sport') || lowerText.includes('team') || lowerText.includes('player')) {
    return PROJECT_MAPPING.sports
  }
  
  // Generic fallback for non-crypto content
  return {
    handle: 'twitter',
    ticker: 'TWEET',
    hashtags: ['#twitter', '#social', '#discussion']
  }
}