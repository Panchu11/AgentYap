interface ProjectMeta {
  handle: string | null
  ticker: string | null
  hashtags: string[]
}

const PROJECT_MAPPING: Record<string, ProjectMeta> = {
  // Major crypto projects with official handles and tickers
  'humanity protocol': {
    handle: 'TK_Humanity',
    ticker: 'HMT',
    hashtags: ['#HumanityProtocol', '#HumanityTestnet', '#PalmScan']
  },
  'humanity': {
    handle: 'TK_Humanity',
    ticker: 'HMT',
    hashtags: ['#HumanityProtocol', '#HumanityTestnet', '#PalmScan']
  },
  'bitcoin': {
    handle: 'bitcoin',
    ticker: 'BTC',
    hashtags: ['#Bitcoin', '#BTC', '#HODL']
  },
  'ethereum': {
    handle: 'ethereum',
    ticker: 'ETH',
    hashtags: ['#Ethereum', '#ETH', '#DeFi']
  },
  'solana': {
    handle: 'solana',
    ticker: 'SOL',
    hashtags: ['#Solana', '#SOL', '#SolanaEcosystem']
  },
  'base': {
    handle: 'base',
    ticker: 'BASE',
    hashtags: ['#Base', '#BaseChain', '#Coinbase']
  },
  'arbitrum': {
    handle: 'arbitrum',
    ticker: 'ARB',
    hashtags: ['#Arbitrum', '#ARB', '#Layer2']
  },
  'polygon': {
    handle: 'polygon',
    ticker: 'MATIC',
    hashtags: ['#Polygon', '#MATIC', '#PolygonEcosystem']
  },
  'optimism': {
    handle: 'optimism',
    ticker: 'OP',
    hashtags: ['#Optimism', '#OP', '#Layer2']
  },
  'avalanche': {
    handle: 'avalancheavax',
    ticker: 'AVAX',
    hashtags: ['#Avalanche', '#AVAX', '#AVAX']
  },
  'chainlink': {
    handle: 'chainlink',
    ticker: 'LINK',
    hashtags: ['#Chainlink', '#LINK', '#Oracle']
  },
  'uniswap': {
    handle: 'Uniswap',
    ticker: 'UNI',
    hashtags: ['#Uniswap', '#UNI', '#DeFi']
  },
  'aave': {
    handle: 'AaveAave',
    ticker: 'AAVE',
    hashtags: ['#Aave', '#AAVE', '#DeFi']
  },
  'compound': {
    handle: 'compoundfinance',
    ticker: 'COMP',
    hashtags: ['#Compound', '#COMP', '#DeFi']
  },
  'opensea': {
    handle: 'opensea',
    ticker: null,
    hashtags: ['#OpenSea', '#NFT', '#NFTMarketplace']
  },
  'metamask': {
    handle: 'MetaMask',
    ticker: null,
    hashtags: ['#MetaMask', '#Web3Wallet', '#Ethereum']
  },
  'binance': {
    handle: 'binance',
    ticker: 'BNB',
    hashtags: ['#Binance', '#BNB', '#BSC']
  },
  'coinbase': {
    handle: 'coinbase',
    ticker: 'COIN',
    hashtags: ['#Coinbase', '#COIN', '#Crypto']
  },
  'xeet': {
    handle: 'xeetdotai',
    ticker: 'XEET',
    hashtags: ['#XeetAi', '#InfoFi', '#DeFi']
  },
  'xeetdotai': {
    handle: 'xeetdotai',
    ticker: 'XEET',
    hashtags: ['#XeetAi', '#InfoFi', '#DeFi']
  }
}

// Enhanced detection patterns
const DETECTION_PATTERNS = [
  // Multi-word project names
  { pattern: /humanity\s+protocol/i, key: 'humanity protocol' },
  { pattern: /xeet\.ai|xeetdotai/i, key: 'xeetdotai' },
  { pattern: /magic\s+eden/i, key: 'magic eden' },
  { pattern: /pancake\s+swap/i, key: 'pancakeswap' },
  { pattern: /sushi\s+swap/i, key: 'sushiswap' },
  { pattern: /curve\s+finance/i, key: 'curve' },
  { pattern: /yearn\s+finance/i, key: 'yearn' },
  { pattern: /maker\s+dao/i, key: 'makerdao' },
  { pattern: /compound\s+finance/i, key: 'compound' },
  // Single word patterns
  { pattern: /\bhumanity\b/i, key: 'humanity' },
  { pattern: /\bxeet\b/i, key: 'xeet' },
  { pattern: /\bbitcoin\b/i, key: 'bitcoin' },
  { pattern: /\bethereum\b/i, key: 'ethereum' },
  { pattern: /\bsolana\b/i, key: 'solana' },
  { pattern: /\bbase\b/i, key: 'base' },
  { pattern: /\barbitrum\b/i, key: 'arbitrum' },
  { pattern: /\bpolygon\b/i, key: 'polygon' },
  { pattern: /\boptimism\b/i, key: 'optimism' },
  { pattern: /\bavalanche\b/i, key: 'avalanche' },
  { pattern: /\bchainlink\b/i, key: 'chainlink' },
  { pattern: /\buniswap\b/i, key: 'uniswap' },
  { pattern: /\baave\b/i, key: 'aave' },
  { pattern: /\bcompound\b/i, key: 'compound' },
  { pattern: /\bopensea\b/i, key: 'opensea' },
  { pattern: /\bmetamask\b/i, key: 'metamask' },
  { pattern: /\bbinance\b/i, key: 'binance' },
  { pattern: /\bcoinbase\b/i, key: 'coinbase' }
]

export function getProjectMeta(tweetText: string): ProjectMeta {
  const lowerText = tweetText.toLowerCase()
  
  // First, check for specific detection patterns (most accurate)
  for (const { pattern, key } of DETECTION_PATTERNS) {
    if (pattern.test(tweetText)) {
      const meta = PROJECT_MAPPING[key]
      if (meta) {
        console.log(`Detected project: ${key}`, meta)
        return meta
      }
    }
  }
  
  // Check for @ mentions in the tweet
  const mentionMatches = tweetText.match(/@(\w+)/g)
  if (mentionMatches) {
    for (const mention of mentionMatches) {
      const handle = mention.substring(1).toLowerCase()
      
      // Direct handle match
      for (const [key, meta] of Object.entries(PROJECT_MAPPING)) {
        if (meta.handle && meta.handle.toLowerCase() === handle) {
          console.log(`Detected project by handle: ${key}`, meta)
          return meta
        }
      }
      
      // Partial handle match (for handles like TK_Humanity)
      for (const [key, meta] of Object.entries(PROJECT_MAPPING)) {
        if (meta.handle && (meta.handle.toLowerCase().includes(handle) || handle.includes(meta.handle.toLowerCase()))) {
          console.log(`Detected project by partial handle: ${key}`, meta)
          return meta
        }
      }
    }
  }
  
  // Check for ticker symbols
  const tickerMatches = tweetText.match(/\$([A-Z]{1,10})/g)
  if (tickerMatches) {
    for (const ticker of tickerMatches) {
      const symbol = ticker.substring(1)
      for (const [key, meta] of Object.entries(PROJECT_MAPPING)) {
        if (meta.ticker === symbol) {
          console.log(`Detected project by ticker: ${key}`, meta)
          return meta
        }
      }
    }
  }
  
  // Check for URL-based detection
  if (tweetText.includes('testnet.humanity.org') || tweetText.includes('humanity.org')) {
    console.log('Detected Humanity Protocol by URL')
    return PROJECT_MAPPING['humanity protocol']
  }
  
  if (tweetText.includes('xeet.ai')) {
    console.log('Detected Xeet by URL')
    return PROJECT_MAPPING['xeetdotai']
  }
  
  // Check for app store links
  if (tweetText.includes('com.humanityapp') || tweetText.includes('humanity-protocol-app')) {
    console.log('Detected Humanity Protocol by app link')
    return PROJECT_MAPPING['humanity protocol']
  }
  
  // Keyword-based detection for common crypto terms
  const cryptoKeywords = [
    'testnet', 'mainnet', 'airdrop', 'snapshot', 'token', 'coin', 'blockchain',
    'defi', 'nft', 'dao', 'yield', 'staking', 'mining', 'wallet', 'dapp',
    'smart contract', 'gas', 'gwei', 'wei', 'satoshi', 'hodl', 'fomo', 'fud'
  ]
  
  const hasCryptoKeywords = cryptoKeywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
  
  if (hasCryptoKeywords) {
    console.log('Detected generic crypto content')
    return {
      handle: null,
      ticker: null,
      hashtags: ['#crypto', '#web3', '#blockchain']
    }
  }
  
  // Ultimate fallback for non-crypto content
  console.log('No specific project detected, using generic fallback')
  return {
    handle: null,
    ticker: null,
    hashtags: ['#discussion', '#social', '#thoughts']
  }
}