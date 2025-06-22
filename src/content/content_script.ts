// Content script for fetching tweets and communicating with sidebar
class TweetFetcher {
  private isContextValid = true
  private observer: MutationObserver | null = null
  private lastTweetCount = 0

  constructor() {
    this.init()
  }

  private init() {
    if (!chrome?.runtime?.id) {
      console.warn('Extension context invalid, stopping initialization')
      return
    }

    // Listen for messages from sidebar
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse)
      return true
    })

    // Start observing for tweet changes
    this.startObserving()

    // Send initial tweets
    setTimeout(() => {
      this.sendTweetsToSidebar()
    }, 1000)

    chrome.runtime.onConnect.addListener(() => {
      this.isContextValid = true
    })
  }

  private async handleMessage(message: any, sendResponse: (response?: any) => void) {
    if (!this.isContextValid || !chrome?.runtime?.id) {
      sendResponse({ 
        success: false, 
        error: 'Extension context invalidated. Please refresh the page.' 
      })
      return
    }

    try {
      switch (message.type) {
        case 'GET_TWEETS':
          const tweets = this.extractTweets()
          sendResponse({ success: true, tweets })
          break

        case 'COPY_TO_CLIPBOARD':
          try {
            await navigator.clipboard.writeText(message.text)
            sendResponse({ success: true })
          } catch (error) {
            sendResponse({ success: false, error: 'Failed to copy to clipboard' })
          }
          break

        case 'FILL_REPLY_BOX':
          try {
            const success = await this.fillReplyBox(message.tweetId, message.text)
            sendResponse({ success })
          } catch (error) {
            sendResponse({ success: false, error: 'Failed to fill reply box' })
          }
          break
      }
    } catch (error) {
      console.error('Error in handleMessage:', error)
      sendResponse({ success: false, error: 'Message handling failed' })
    }
  }

  private startObserving() {
    if (!this.isContextValid) return

    this.observer = new MutationObserver((mutations) => {
      if (!this.isContextValid) return

      let shouldCheck = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if new tweets were added
          const addedNodes = Array.from(mutation.addedNodes)
          if (addedNodes.some(node => 
            node instanceof Element && 
            (node.querySelector('[data-testid="tweet"]') || node.matches('[data-testid="tweet"]'))
          )) {
            shouldCheck = true
          }
        }
      })

      if (shouldCheck) {
        setTimeout(() => {
          this.sendTweetsToSidebar()
        }, 500)
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Periodic check for new tweets
    setInterval(() => {
      if (this.isContextValid) {
        this.sendTweetsToSidebar()
      }
    }, 3000)
  }

  private extractTweets() {
    const tweets: any[] = []
    
    // Find all tweet articles
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]')
    
    tweetElements.forEach((tweetElement, index) => {
      try {
        // Extract tweet text
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]')
        const tweetText = tweetTextElement?.textContent?.trim()
        
        if (!tweetText || tweetText.length < 10) return

        // Extract author info
        const authorElement = tweetElement.querySelector('[data-testid="User-Name"]')
        const authorName = authorElement?.textContent?.trim() || 'Unknown User'
        
        // Extract username
        const usernameElement = tweetElement.querySelector('[role="link"][href*="/"]')
        const username = usernameElement?.getAttribute('href')?.split('/').pop() || 'unknown'

        // Extract timestamp
        const timeElement = tweetElement.querySelector('time')
        const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString()

        // Create unique ID
        const tweetId = this.createTweetId(tweetText, username, timestamp, index)

        // Extract engagement metrics
        const replyButton = tweetElement.querySelector('[data-testid="reply"]')
        const retweetButton = tweetElement.querySelector('[data-testid="retweet"]')
        const likeButton = tweetElement.querySelector('[data-testid="like"]')

        const replyCount = this.extractCount(replyButton)
        const retweetCount = this.extractCount(retweetButton)
        const likeCount = this.extractCount(likeButton)

        // Check if this tweet has a reply box
        const hasReplyBox = this.checkForReplyBox(tweetElement)

        tweets.push({
          id: tweetId,
          text: tweetText,
          author: authorName,
          username: username,
          timestamp: timestamp,
          replyCount,
          retweetCount,
          likeCount,
          hasReplyBox,
          element: null // Don't send DOM elements to sidebar
        })
      } catch (error) {
        console.warn('Error extracting tweet:', error)
      }
    })

    return tweets.slice(0, 20) // Limit to 20 most recent tweets
  }

  private createTweetId(text: string, username: string, timestamp: string, index: number): string {
    const hash = this.simpleHash(text + username + timestamp)
    return `tweet-${hash}-${index}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private extractCount(button: Element | null): number {
    if (!button) return 0
    
    const countElement = button.querySelector('[data-testid*="count"]')
    if (!countElement) return 0
    
    const countText = countElement.textContent?.trim() || '0'
    
    // Handle K, M suffixes
    if (countText.includes('K')) {
      return Math.round(parseFloat(countText.replace('K', '')) * 1000)
    }
    if (countText.includes('M')) {
      return Math.round(parseFloat(countText.replace('M', '')) * 1000000)
    }
    
    return parseInt(countText) || 0
  }

  private checkForReplyBox(tweetElement: Element): boolean {
    // Check if there's a reply box associated with this tweet
    const replyButton = tweetElement.querySelector('[data-testid="reply"]')
    return !!replyButton
  }

  private async sendTweetsToSidebar() {
    try {
      const tweets = this.extractTweets()
      
      // Only send if tweet count changed significantly
      if (Math.abs(tweets.length - this.lastTweetCount) > 2) {
        this.lastTweetCount = tweets.length
        
        if (chrome?.runtime?.id) {
          chrome.runtime.sendMessage({
            type: 'TWEETS_UPDATED',
            tweets: tweets
          }).catch(() => {
            // Sidebar might not be open, ignore error
          })
        }
      }
    } catch (error) {
      console.warn('Error sending tweets to sidebar:', error)
    }
  }

  private async fillReplyBox(tweetId: string, text: string): Promise<boolean> {
    try {
      // Find the tweet element by ID
      const tweets = this.extractTweets()
      const tweet = tweets.find(t => t.id === tweetId)
      
      if (!tweet) {
        console.warn('Tweet not found for ID:', tweetId)
        return false
      }

      // Find the tweet element in DOM
      const tweetElements = document.querySelectorAll('article[data-testid="tweet"]')
      let targetTweetElement: Element | null = null

      for (const element of tweetElements) {
        const tweetTextElement = element.querySelector('[data-testid="tweetText"]')
        if (tweetTextElement?.textContent?.trim() === tweet.text) {
          targetTweetElement = element
          break
        }
      }

      if (!targetTweetElement) {
        console.warn('Could not find tweet element in DOM')
        return false
      }

      // Click reply button to open reply box
      const replyButton = targetTweetElement.querySelector('[data-testid="reply"]') as HTMLElement
      if (replyButton) {
        replyButton.click()
        
        // Wait for reply box to appear
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Find and fill the reply box
        const replyBox = await this.findReplyBox()
        if (replyBox) {
          await this.fillTextArea(replyBox, text)
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error filling reply box:', error)
      return false
    }
  }

  private async findReplyBox(): Promise<HTMLElement | null> {
    const selectors = [
      '[data-testid="tweetTextarea_0"]',
      '[data-testid="tweetTextarea_1"]',
      '[role="textbox"][data-testid*="tweet"]',
      '.public-DraftEditor-content',
      '[contenteditable="true"][aria-label*="reply"]'
    ]

    for (let attempt = 0; attempt < 10; attempt++) {
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement
        if (element && this.isElementVisible(element)) {
          return element
        }
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return null
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  private async fillTextArea(element: HTMLElement, text: string): Promise<void> {
    // Focus the element
    element.focus()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear existing content
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      (element as HTMLInputElement).value = ''
    } else {
      element.textContent = ''
      element.innerHTML = ''
    }

    // Set new content
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      (element as HTMLInputElement).value = text
    } else {
      element.textContent = text
      element.innerHTML = text
    }

    // Trigger events
    const events = [
      new Event('focus', { bubbles: true }),
      new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }),
      new Event('change', { bubbles: true }),
      new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
      new KeyboardEvent('keyup', { bubbles: true, key: 'a' })
    ]

    for (const event of events) {
      try {
        element.dispatchEvent(event)
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (e) {
        console.warn('Could not dispatch event:', e)
      }
    }
  }

  public destroy() {
    this.isContextValid = false
    
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Initialize the tweet fetcher
if (chrome?.runtime?.id) {
  const fetcher = new TweetFetcher()

  window.addEventListener('beforeunload', () => {
    fetcher.destroy()
  })

  chrome.runtime.onConnect.addListener(() => {
    console.log('Extension context restored')
  })
} else {
  console.warn('Extension context not available, skipping initialization')
}