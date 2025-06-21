import { generateReply } from '../utils/generateReply'
import { rewriteReply } from '../utils/rewriteReply'

class AgentYapInjector {
  private observer: MutationObserver | null = null
  private injectedButtons = new Set<string>()

  constructor() {
    this.init()
  }

  private init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startObserving())
    } else {
      this.startObserving()
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse)
    })
  }

  private async handleMessage(message: any, sendResponse: (response?: any) => void) {
    switch (message.type) {
      case 'GENERATE_REPLY':
        try {
          const reply = await generateReply(message.tweetText, message.tone)
          // Send reply back to popup
          chrome.runtime.sendMessage({
            type: 'REPLY_GENERATED',
            reply: reply
          })
          sendResponse({ success: true, reply })
        } catch (error) {
          console.error('Error generating reply:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          sendResponse({ success: false, error: errorMessage })
        }
        break

      case 'REWRITE_REPLY':
        try {
          const newReply = await rewriteReply(message.originalReply)
          chrome.runtime.sendMessage({
            type: 'REPLY_GENERATED',
            reply: newReply
          })
          sendResponse({ success: true, reply: newReply })
        } catch (error) {
          console.error('Error rewriting reply:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          sendResponse({ success: false, error: errorMessage })
        }
        break
    }
  }

  private startObserving() {
    this.injectButtons()
    
    // Set up mutation observer for infinite scroll
    this.observer = new MutationObserver((mutations) => {
      let shouldInject = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldInject = true
        }
      })
      
      if (shouldInject) {
        setTimeout(() => this.injectButtons(), 500)
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private injectButtons() {
    // Find all tweet articles
    const tweets = document.querySelectorAll('article[data-testid="tweet"]')
    
    tweets.forEach((tweet, index) => {
      const tweetId = this.getTweetId(tweet as HTMLElement, index)
      
      if (this.injectedButtons.has(tweetId)) {
        return // Already injected
      }

      const tweetText = this.extractTweetText(tweet as HTMLElement)
      if (!tweetText) return

      this.injectReplyButton(tweet as HTMLElement, tweetText, tweetId)
      this.injectedButtons.add(tweetId)
    })
  }

  private getTweetId(tweet: HTMLElement, fallbackIndex: number): string {
    // Try to get tweet ID from URL or use fallback
    const timeElement = tweet.querySelector('time')
    const link = timeElement?.closest('a') as HTMLAnchorElement
    
    if (link?.href) {
      const match = link.href.match(/status\/(\d+)/)
      if (match) return match[1]
    }
    
    return `tweet-${fallbackIndex}-${Date.now()}`
  }

  private extractTweetText(tweet: HTMLElement): string | null {
    // Find the tweet text content
    const textElement = tweet.querySelector('[data-testid="tweetText"]')
    if (textElement) {
      return textElement.textContent?.trim() || null
    }

    // Fallback: look for text in tweet body
    const tweetBody = tweet.querySelector('[lang]')
    if (tweetBody) {
      return tweetBody.textContent?.trim() || null
    }

    return null
  }

  private injectReplyButton(tweet: HTMLElement, tweetText: string, tweetId: string) {
    // Find the action bar (where like, retweet, reply buttons are)
    const actionBar = tweet.querySelector('[role="group"]')
    if (!actionBar) return

    // Create our button
    const button = document.createElement('button')
    button.className = 'agentyap-reply-btn'
    button.innerHTML = '💬 Reply with AI'
    button.style.cssText = `
      background: linear-gradient(135deg, #1DA1F2, #0d8bd9);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(29, 161, 242, 0.2);
    `

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)'
      button.style.boxShadow = '0 4px 8px rgba(29, 161, 242, 0.3)'
    })

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)'
      button.style.boxShadow = '0 2px 4px rgba(29, 161, 242, 0.2)'
    })

    // Handle click
    button.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Send tweet to popup
      chrome.runtime.sendMessage({
        type: 'TWEET_SELECTED',
        tweetText: tweetText,
        tweetId: tweetId
      })

      // Visual feedback
      button.style.background = '#0d8bd9'
      button.innerHTML = '✅ Selected'
      
      setTimeout(() => {
        button.style.background = 'linear-gradient(135deg, #1DA1F2, #0d8bd9)'
        button.innerHTML = '💬 Reply with AI'
      }, 2000)
    })

    // Insert button into action bar
    actionBar.appendChild(button)
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
    
    // Remove all injected buttons
    document.querySelectorAll('.agentyap-reply-btn').forEach(btn => btn.remove())
    this.injectedButtons.clear()
  }
}

// Initialize the injector
const injector = new AgentYapInjector()

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  injector.destroy()
})