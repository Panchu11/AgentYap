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
      return true // Keep message channel open for async response
    })
  }

  private async handleMessage(message: any, sendResponse: (response?: any) => void) {
    try {
      switch (message.type) {
        case 'GENERATE_REPLY':
          try {
            const reply = await generateReply(message.tweetText, message.tone)
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
    } catch (error) {
      console.error('Error in handleMessage:', error)
      sendResponse({ success: false, error: 'Message handling failed' })
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
      
      // Show loading state
      button.style.background = '#0d8bd9'
      button.innerHTML = '⏳ Generating...'
      button.disabled = true
      
      try {
        // First, click the reply button to open the reply box
        const replyButton = tweet.querySelector('[data-testid="reply"]') as HTMLElement
        if (replyButton) {
          replyButton.click()
          
          // Wait for reply box to appear
          await this.waitForElement('[data-testid="tweetTextarea_0"]', 5000)
        }
        
        // Generate the reply
        const reply = await generateReply(tweetText, 'Smart') // Default to Smart tone
        
        // Find and fill the reply textarea
        const replyTextarea = document.querySelector('[data-testid="tweetTextarea_0"]') as HTMLTextAreaElement
        if (replyTextarea) {
          // Focus and clear existing content
          replyTextarea.focus()
          replyTextarea.value = ''
          
          // Set the value using multiple methods to ensure Twitter recognizes it
          replyTextarea.value = reply
          replyTextarea.textContent = reply
          
          // Trigger multiple events to ensure Twitter recognizes the change
          const events = [
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new KeyboardEvent('keydown', { bubbles: true }),
            new KeyboardEvent('keyup', { bubbles: true })
          ]
          
          events.forEach(event => replyTextarea.dispatchEvent(event))
          
          // Also try setting innerHTML for the contenteditable div if it exists
          const editableDiv = replyTextarea.closest('[contenteditable="true"]') as HTMLElement
          if (editableDiv) {
            editableDiv.textContent = reply
            editableDiv.innerHTML = reply
            events.forEach(event => editableDiv.dispatchEvent(event))
          }
          
          // Try alternative selectors for the reply box
          const alternativeSelectors = [
            '[data-testid="tweetTextarea_0"]',
            '[role="textbox"]',
            '.public-DraftEditor-content',
            '.notranslate'
          ]
          
          for (const selector of alternativeSelectors) {
            const element = document.querySelector(selector) as HTMLElement
            if (element && element !== replyTextarea) {
              element.textContent = reply
              if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                (element as HTMLInputElement).value = reply
              }
              events.forEach(event => element.dispatchEvent(event))
            }
          }
          
          // Success feedback
          button.style.background = '#10B981'
          button.innerHTML = '✅ Reply Added!'
          button.disabled = false
          
          // Add rewrite button
          this.addRewriteButton(button, reply, replyTextarea)
          
        } else {
          throw new Error('Could not find reply textarea')
        }
        
      } catch (error) {
        console.error('Error generating reply:', error)
        button.style.background = '#EF4444'
        button.innerHTML = '❌ Error'
        button.disabled = false
        
        setTimeout(() => {
          button.style.background = 'linear-gradient(135deg, #1DA1F2, #0d8bd9)'
          button.innerHTML = '💬 Reply with AI'
        }, 3000)
      }
    })

    // Insert button into action bar
    actionBar.appendChild(button)
  }

  private addRewriteButton(originalButton: HTMLElement, currentReply: string, textarea: HTMLTextAreaElement) {
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
      
      rewriteButton.innerHTML = '⏳ Rewriting...'
      rewriteButton.disabled = true
      
      try {
        const newReply = await rewriteReply(currentReply)
        
        // Update textarea with same method as original
        textarea.focus()
        textarea.value = newReply
        textarea.textContent = newReply
        
        const events = [
          new Event('input', { bubbles: true }),
          new Event('change', { bubbles: true }),
          new KeyboardEvent('keydown', { bubbles: true }),
          new KeyboardEvent('keyup', { bubbles: true })
        ]
        
        events.forEach(event => textarea.dispatchEvent(event))
        
        const editableDiv = textarea.closest('[contenteditable="true"]') as HTMLElement
        if (editableDiv) {
          editableDiv.textContent = newReply
          editableDiv.innerHTML = newReply
          events.forEach(event => editableDiv.dispatchEvent(event))
        }
        
        rewriteButton.innerHTML = '✅ Rewritten!'
        
        // Update the current reply for next rewrite
        setTimeout(() => {
          rewriteButton.innerHTML = '🔄 Rewrite'
          rewriteButton.disabled = false
          // Update the rewrite button to use the new reply
          this.addRewriteButton(originalButton, newReply, textarea)
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

  private waitForElement(selector: string, timeout: number = 5000): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector)
        if (element) {
          observer.disconnect()
          resolve(element)
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      setTimeout(() => {
        observer.disconnect()
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)
    })
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
    
    // Remove all injected buttons
    document.querySelectorAll('.agentyap-reply-btn, .agentyap-rewrite-btn').forEach(btn => btn.remove())
    this.injectedButtons.clear()
  }
}

// Initialize the injector
const injector = new AgentYapInjector()

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  injector.destroy()
})