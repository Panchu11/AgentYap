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
  }
}

export function getProjectMeta(tweetText: string): ProjectMeta | null {
  const lowerText = tweetText.toLowerCase()
  
  // Check for exact matches first
  for (const [keyword, meta] of Object.entries(PROJECT_MAPPING)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return meta
    }
  }
  
  // Check for ticker symbols
  const tickerMatches = tweetText.match(/\$([A-Z]{2,10})/g)
  if (tickerMatches) {
    for (const ticker of tickerMatches) {
      const symbol = ticker.substring(1) // Remove $
      for (const meta of Object.values(PROJECT_MAPPING)) {
        if (meta.ticker === symbol) {
          return meta
        }
      }
    }
  }
  
  // Check for @ mentions
  const mentionMatches = tweetText.match(/@(\w+)/g)
  if (mentionMatches) {
    for (const mention of mentionMatches) {
      const handle = mention.substring(1) // Remove @
      for (const meta of Object.values(PROJECT_MAPPING)) {
        if (meta.handle.toLowerCase() === handle.toLowerCase()) {
          return meta
        }
      }
    }
  }
  
  // Default fallback
  return {
    handle: 'crypto',
    ticker: 'CRYPTO',
    hashtags: ['#crypto', '#web3', '#blockchain']
  }
}