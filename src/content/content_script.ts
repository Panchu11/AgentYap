import { generateReply } from '../utils/generateReply'
import { rewriteReply } from '../utils/rewriteReply'

class AgentYapInjector {
  private observer: MutationObserver | null = null
  private injectedButtons = new Set<string>()
  private isContextValid = true

  constructor() {
    this.init()
  }

  private init() {
    // Check if extension context is valid
    if (!chrome?.runtime?.id) {
      console.warn('Extension context invalid, stopping initialization')
      return
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startObserving())
    } else {
      this.startObserving()
    }

    // Listen for messages from popup with enhanced error handling
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse)
      return true // Keep message channel open for async response
    })

    // Listen for extension context invalidation
    chrome.runtime.onConnect.addListener(() => {
      // Connection established, context is valid
      this.isContextValid = true
    })
  }

  private async handleMessage(message: any, sendResponse: (response?: any) => void) {
    // Check context validity
    if (!this.isContextValid || !chrome?.runtime?.id) {
      sendResponse({ 
        success: false, 
        error: 'Extension context invalidated. Please refresh the page.' 
      })
      return
    }

    try {
      switch (message.type) {
        case 'GENERATE_REPLY':
          try {
            const reply = await generateReply(message.tweetText, message.tone)
            // Send reply back to popup with context check
            try {
              if (chrome?.runtime?.id) {
                chrome.runtime.sendMessage({
                  type: 'REPLY_GENERATED',
                  reply: reply
                })
              }
            } catch (e) {
              console.warn('Could not send message to popup:', e)
            }
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
            try {
              if (chrome?.runtime?.id) {
                chrome.runtime.sendMessage({
                  type: 'REPLY_GENERATED',
                  reply: newReply
                })
              }
            } catch (e) {
              console.warn('Could not send message to popup:', e)
            }
            sendResponse({ success: true, reply: newReply })
          } catch (error) {
            console.error('Error rewriting reply:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            sendResponse({ success: false, error: errorMessage })
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

    this.injectButtons()
    
    // Set up mutation observer for infinite scroll
    this.observer = new MutationObserver((mutations) => {
      if (!this.isContextValid) return

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
    if (!this.isContextValid) return

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

    // Check if button already exists
    if (actionBar.querySelector('.agentyap-reply-btn')) return

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
      z-index: 1000;
      position: relative;
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

    // Handle click - directly generate and inject reply
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Check context validity before proceeding
      if (!this.isContextValid || !chrome?.runtime?.id) {
        button.style.background = '#EF4444'
        button.innerHTML = '❌ Extension Error'
        setTimeout(() => {
          button.style.background = 'linear-gradient(135deg, #1DA1F2, #0d8bd9)'
          button.innerHTML = '💬 Reply with AI'
        }, 3000)
        return
      }
      
      // Show loading state
      button.style.background = '#0d8bd9'
      button.innerHTML = '⏳ Generating...'
      button.disabled = true
      
      try {
        // First, click the reply button to open the reply box
        const replyButton = tweet.querySelector('[data-testid="reply"]') as HTMLElement
        if (replyButton) {
          replyButton.click()
          
          // Wait for reply box to appear with multiple attempts
          await this.waitForReplyBox()
        }
        
        // Generate the reply
        const reply = await generateReply(tweetText, 'Smart') // Default to Smart tone
        
        // Find and fill the reply textarea with multiple methods
        await this.fillReplyBox(reply)
        
        // Success feedback
        button.style.background = '#10B981'
        button.innerHTML = '✅ Reply Added!'
        button.disabled = false
        
        // Add rewrite button
        this.addRewriteButton(button, reply)
        
      } catch (error) {
        console.error('Error generating reply:', error)
        button.style.background = '#EF4444'
        
        // Show specific error message
        if (error instanceof Error) {
          if (error.message.includes('Extension context invalidated') || 
              error.message.includes('Extension was reloaded')) {
            button.innerHTML = '🔄 Refresh Page'
          } else if (error.message.includes('API key')) {
            button.innerHTML = '🔑 Check API Key'
          } else {
            button.innerHTML = '❌ Error'
          }
        } else {
          button.innerHTML = '❌ Error'
        }
        
        button.disabled = false
        
        setTimeout(() => {
          button.style.background = 'linear-gradient(135deg, #1DA1F2, #0d8bd9)'
          button.innerHTML = '💬 Reply with AI'
        }, 5000)
      }
    })

    // Insert button into action bar
    actionBar.appendChild(button)
  }

  private async waitForReplyBox(): Promise<void> {
    const selectors = [
      '[data-testid="tweetTextarea_0"]',
      '[role="textbox"]',
      '.public-DraftEditor-content',
      '.notranslate',
      '[contenteditable="true"]'
    ]

    for (let attempt = 0; attempt < 15; attempt++) {
      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element) {
          console.log(`Found reply box with selector: ${selector}`)
          return
        }
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    throw new Error('Could not find reply textarea after multiple attempts')
  }

  private async fillReplyBox(reply: string): Promise<void> {
    const selectors = [
      '[data-testid="tweetTextarea_0"]',
      '[role="textbox"]',
      '.public-DraftEditor-content',
      '.notranslate',
      '[contenteditable="true"]'
    ]

    let filled = false

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        try {
          // Focus the element first
          element.focus()
          
          // Clear existing content
          if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            (element as HTMLInputElement).value = ''
          } else {
            element.textContent = ''
            element.innerHTML = ''
          }

          // Set the new content
          if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            (element as HTMLInputElement).value = reply
          } else {
            element.textContent = reply
            element.innerHTML = reply
          }

          // Trigger comprehensive events to notify Twitter
          const events = [
            new Event('focus', { bubbles: true }),
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
            new KeyboardEvent('keyup', { bubbles: true, key: 'a' }),
            new Event('blur', { bubbles: true }),
            new Event('paste', { bubbles: true }),
            // Additional events for Twitter's React components
            new InputEvent('input', { bubbles: true, inputType: 'insertText', data: reply }),
            new Event('compositionend', { bubbles: true }),
            new KeyboardEvent('keypress', { bubbles: true, key: 'Enter' }),
          ]

          events.forEach(event => {
            try {
              element.dispatchEvent(event)
            } catch (e) {
              console.warn('Could not dispatch event:', e)
            }
          })

          // Additional step: simulate typing to trigger React state updates
          await this.simulateTyping(element, reply)

          console.log(`Successfully filled reply box using selector: ${selector}`)
          filled = true
          break
        } catch (e) {
          console.warn(`Failed to fill element with selector ${selector}:`, e)
        }
      }
    }

    if (!filled) {
      throw new Error('Could not fill any reply textarea')
    }
  }

  private async simulateTyping(element: HTMLElement, text: string): Promise<void> {
    // Clear the element first
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      (element as HTMLInputElement).value = ''
    } else {
      element.textContent = ''
      element.innerHTML = ''
    }

    // Focus the element
    element.focus()

    // Simulate typing character by character
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      // Update the content
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        (element as HTMLInputElement).value += char
      } else {
        element.textContent += char
        element.innerHTML = element.textContent
      }

      // Dispatch input event for each character
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: char
      })
      element.dispatchEvent(inputEvent)

      // Small delay to make it more realistic
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    // Final events to ensure Twitter recognizes the content
    const finalEvents = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new KeyboardEvent('keyup', { bubbles: true, key: 'a' }),
      new Event('blur', { bubbles: true }),
      new Event('focus', { bubbles: true })
    ]

    finalEvents.forEach(event => {
      try {
        element.dispatchEvent(event)
      } catch (e) {
        console.warn('Could not dispatch final event:', e)
      }
    })
  }

  private addRewriteButton(originalButton: HTMLElement, currentReply: string) {
    // Remove any existing rewrite button
    const existingRewrite = originalButton.parentElement?.querySelector('.agentyap-rewrite-btn')
    if (existingRewrite) {
      existingRewrite.remove()
    }

    // Create rewrite button
    const rewriteButton = document.createElement('button')
    rewriteButton.className = 'agentyap-rewrite-btn'
    rewriteButton.innerHTML = '🔄 Rewrite'
    rewriteButton.style.cssText = `
      background: #6B7280;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(107, 116, 128, 0.2);
      z-index: 1000;
      position: relative;
    `

    rewriteButton.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Check context validity
      if (!this.isContextValid || !chrome?.runtime?.id) {
        rewriteButton.innerHTML = '🔄 Refresh Page'
        return
      }
      
      rewriteButton.innerHTML = '⏳ Rewriting...'
      rewriteButton.disabled = true
      
      try {
        const newReply = await rewriteReply(currentReply)
        
        // Fill the reply box with the new reply
        await this.fillReplyBox(newReply)
        
        rewriteButton.innerHTML = '✅ Rewritten!'
        
        // Update the current reply for next rewrite
        setTimeout(() => {
          rewriteButton.innerHTML = '🔄 Rewrite'
          rewriteButton.disabled = false
          // Update the rewrite button to use the new reply
          this.addRewriteButton(originalButton, newReply)
        }, 2000)
        
      } catch (error) {
        console.error('Error rewriting reply:', error)
        rewriteButton.innerHTML = '❌ Error'
        setTimeout(() => {
          rewriteButton.innerHTML = '🔄 Rewrite'
          rewriteButton.disabled = false
        }, 3000)
      }
    })

    // Insert after the original button
    originalButton.parentElement?.insertBefore(rewriteButton, originalButton.nextSibling)
  }

  public destroy() {
    this.isContextValid = false
    
    if (this.observer) {
      this.observer.disconnect()
    }
    
    // Remove all injected buttons
    document.querySelectorAll('.agentyap-reply-btn, .agentyap-rewrite-btn').forEach(btn => btn.remove())
    this.injectedButtons.clear()
  }
}

// Initialize the injector with context check
if (chrome?.runtime?.id) {
  const injector = new AgentYapInjector()

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    injector.destroy()
  })

  // Handle extension context invalidation
  chrome.runtime.onConnect.addListener(() => {
    console.log('Extension context restored')
  })
} else {
  console.warn('Extension context not available, skipping initialization')
}