# YapMate Technical Documentation

## 🏗️ Architecture Overview

YapMate is built as a Chrome extension using modern web technologies with a focus on performance, security, and user experience. The architecture follows a modular design pattern with clear separation of concerns.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Popup     │  │   Sidebar   │  │   Content Script    │  │
│  │   (React)   │  │   (React)   │  │   (Vanilla JS)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Background Service Worker                  │  │
│  └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    External APIs                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Fireworks   │  │   Chrome    │  │    Twitter/X        │  │
│  │     AI      │  │   Storage   │  │      DOM            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.2.2**: Type-safe development with strict mode
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Vite 5.1.4**: Fast build tool and development server

### Build & Development Tools
- **@vitejs/plugin-react**: React support for Vite
- **PostCSS**: CSS processing with Autoprefixer
- **Chrome Types**: TypeScript definitions for Chrome APIs

### External Integrations
- **Fireworks AI API**: Advanced language model for reply generation
- **Chrome Extension APIs**: Native browser integration
- **Chrome Storage API**: Secure local data storage

## 📁 Project Structure

```
yapmate/
├── src/
│   ├── api/
│   │   └── fireworks.ts          # Fireworks AI integration
│   ├── background/
│   │   └── background.ts         # Service worker
│   ├── content/
│   │   └── content_script.ts     # Twitter DOM interaction
│   ├── popup/
│   │   ├── App.tsx              # Popup main component
│   │   ├── index.tsx            # Popup entry point
│   │   └── components/          # Popup components
│   ├── sidebar/
│   │   ├── SidebarApp.tsx       # Sidebar main component
│   │   ├── index.tsx            # Sidebar entry point
│   │   └── components/          # Sidebar components
│   └── utils/
│       ├── generateReply.ts     # AI reply generation logic
│       ├── rewriteReply.ts      # Reply rewriting functionality
│       └── getProjectMeta.ts    # Crypto project detection
├── dist/                        # Built extension files
├── docs/                        # Documentation
├── manifest.json               # Extension manifest
└── package.json               # Dependencies and scripts
```

## 🔧 Core Components

### 1. Background Service Worker (`background.ts`)

Handles extension lifecycle and tab management:

```typescript
// Sidebar management
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Auto-enable sidebar on Twitter/X
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('x.com') || tab.url.includes('twitter.com')) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidebar.html',
        enabled: true
      })
    }
  }
})
```

### 2. Content Script (`content_script.ts`)

Manages Twitter DOM interaction and tweet extraction:

```typescript
class TweetFetcher {
  private extractTweets() {
    const tweets: Tweet[] = []
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]')
    
    tweetElements.forEach((element, index) => {
      // Extract tweet data from DOM
      const tweetText = element.querySelector('[data-testid="tweetText"]')?.textContent
      const author = element.querySelector('[data-testid="User-Name"]')?.textContent
      // ... more extraction logic
    })
    
    return tweets
  }
}
```

### 3. Sidebar Application (`SidebarApp.tsx`)

Main React application for the sidebar interface:

```typescript
function SidebarApp() {
  const [state, setState] = useState<AppState>({
    tweets: [],
    cryptoMode: true,
    theme: 'light',
    apiKeyConfigured: false
  })

  // Tweet fetching, reply generation, and UI management
  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with controls */}
      {/* Tweet list */}
      {/* Footer */}
    </div>
  )
}
```

## 🤖 AI Integration

### Fireworks AI Implementation

```typescript
export async function fireworksAPI(prompt: string): Promise<string> {
  const apiKey = await getStoredApiKey()
  
  const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.9
    })
  })
  
  return processResponse(response)
}
```

### Smart Fallback System

```typescript
function generateSmartFallback(tweetText: string, tone: string, cryptoMode: boolean): string {
  if (cryptoMode) {
    const projectMeta = getProjectMeta(tweetText)
    return generateCryptoFallback(projectMeta, tone)
  } else {
    return generateGeneralFallback(tone)
  }
}
```

## 🔍 Project Detection Algorithm

### Crypto Project Recognition

```typescript
const PROJECT_MAPPING = {
  'bitcoin': { handle: 'bitcoin', ticker: 'BTC', hashtags: ['#Bitcoin', '#BTC'] },
  'ethereum': { handle: 'ethereum', ticker: 'ETH', hashtags: ['#Ethereum', '#ETH'] },
  // ... more projects
}

const DETECTION_PATTERNS = [
  { pattern: /\bbitcoin\b/i, key: 'bitcoin' },
  { pattern: /\bethereum\b/i, key: 'ethereum' },
  // ... more patterns
]

export function getProjectMeta(tweetText: string): ProjectMeta {
  // Pattern matching
  // Handle detection (@mentions)
  // Ticker detection ($symbols)
  // URL analysis
  // Keyword analysis
}
```

## 🎨 UI/UX Implementation

### Theme System

```typescript
const themes = {
  light: {
    bg: 'bg-gray-50',
    card: 'bg-white border-gray-200',
    text: 'text-gray-900'
  },
  dark: {
    bg: 'bg-gray-900',
    card: 'bg-gray-800 border-gray-700',
    text: 'text-gray-100'
  }
}
```

### Animation System

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Typewriter effect for reply generation */
.typewriter-cursor {
  animation: blink 1s infinite;
}
```

## 🔒 Security & Privacy

### Data Protection
- **No Server Storage**: All user data stays local
- **Encrypted API Keys**: Chrome's secure storage with encryption
- **HTTPS Only**: All external communications use TLS
- **No Tracking**: Zero user analytics or tracking

### API Security
```typescript
// API key validation
if (!apiKey.startsWith('fw_')) {
  throw new Error('Invalid API key format')
}

// Secure storage
await chrome.storage.sync.set({ 
  fireworksApiKey: encryptedApiKey 
})
```

## 📊 Performance Optimization

### Efficient Tweet Processing
```typescript
// Debounced tweet fetching
const debouncedFetch = debounce(fetchTweets, 500)

// Efficient DOM queries
const tweetElements = document.querySelectorAll('article[data-testid="tweet"]')

// Memory management
const tweets = tweets.slice(0, 20) // Limit to 20 tweets
```

### Bundle Optimization
- **Code Splitting**: Separate bundles for popup and sidebar
- **Tree Shaking**: Remove unused code
- **Minification**: Compressed production builds
- **Lazy Loading**: Components loaded on demand

## 🧪 Testing Strategy

### Unit Testing
```typescript
describe('generateReply', () => {
  it('should generate crypto-focused replies in crypto mode', async () => {
    const reply = await generateReply('Bitcoin is pumping!', 'Smart', true)
    expect(reply).toContain('#Bitcoin')
    expect(reply).toContain('$BTC')
  })
})
```

### Integration Testing
- Chrome extension API mocking
- Fireworks AI response simulation
- DOM manipulation testing

### End-to-End Testing
- Full user workflow testing
- Cross-browser compatibility
- Performance benchmarking

## 🚀 Deployment Pipeline

### Build Process
```bash
# Development
npm run dev

# Production build
npm run build

# Extension packaging
npm run build:extension
```

### CI/CD Pipeline
1. **Code Quality**: ESLint, Prettier, TypeScript checks
2. **Testing**: Unit and integration tests
3. **Build**: Production bundle generation
4. **Packaging**: Chrome extension zip creation
5. **Deployment**: Chrome Web Store submission

## 📈 Monitoring & Analytics

### Performance Metrics
- Extension load time
- API response times
- Memory usage
- Error rates

### User Experience Metrics
- Feature usage statistics
- User satisfaction scores
- Support ticket analysis

## 🔮 Future Technical Enhancements

### Planned Improvements
1. **WebAssembly Integration**: Faster local processing
2. **Service Worker Optimization**: Better background processing
3. **Advanced Caching**: Intelligent response caching
4. **Real-time Sync**: Cross-device synchronization
5. **Plugin Architecture**: Extensible functionality

### Scalability Considerations
- **Microservices**: Modular backend services
- **CDN Integration**: Global content delivery
- **Database Optimization**: Efficient data storage
- **Load Balancing**: High availability architecture

---

## 📚 API Reference

### Chrome Extension APIs Used
- `chrome.action`: Extension icon management
- `chrome.sidePanel`: Sidebar interface
- `chrome.storage.sync`: Secure data storage
- `chrome.tabs`: Tab management and messaging
- `chrome.runtime`: Extension lifecycle

### Internal APIs

#### `generateReply(tweetText, tone, cryptoMode)`
Generates AI-powered replies based on tweet content and user preferences.

#### `getProjectMeta(tweetText)`
Analyzes tweet content to detect crypto projects and extract metadata.

#### `rewriteReply(originalReply)`
Creates alternative versions of generated replies while maintaining context.

---

*This technical documentation is maintained by the YapMate development team and updated with each release.*