import { generateReply } from '../utils/generateReply'
import { rewriteReply } from '../utils/rewriteReply'

class AgentYapInjector {
  private observer: MutationObserver | null = null
  private replyBoxObserver: MutationObserver | null = null
  private isContextValid = true
  private currentTweetText: string | null = null

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

    // Set up mutation observer for infinite scroll and reply boxes
    this.observer = new MutationObserver((mutations) => {
      if (!this.isContextValid) return

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for new reply boxes
          this.checkForReplyBoxes()
        }
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Initial check for existing reply boxes
    this.checkForReplyBoxes()
  }

  private checkForReplyBoxes() {
    // Look for reply textareas that don't have our AI button yet
    const replySelectors = [
      '[data-testid="tweetTextarea_0"]',
      '[role="textbox"][data-testid*="tweet"]',
      '.public-DraftEditor-content',
      '[contenteditable="true"][data-testid*="tweet"]'
    ]

    for (const selector of replySelectors) {
      const replyBoxes = document.querySelectorAll(selector)
      replyBoxes.forEach((replyBox) => {
        if (!replyBox.closest('.agentyap-container')) {
          this.injectAIControls(replyBox as HTMLElement)
        }
      })
    }
  }

  private injectAIControls(replyBox: HTMLElement) {
    // Find the tweet we're replying to
    const tweetText = this.findTweetTextForReply(replyBox)
    if (!tweetText) return

    // Create container for our AI controls
    const container = document.createElement('div')
    container.className = 'agentyap-container'
    container.style.cssText = `
      margin-top: 8px;
      padding: 8px;
      background: #f7f9fa;
      border-radius: 8px;
      border: 1px solid #e1e8ed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `

    // Create tone selector
    const toneSelector = this.createToneSelector()
    
    // Create generate button
    const generateButton = this.createGenerateButton(replyBox, tweetText)
    
    // Create rewrite button (initially hidden)
    const rewriteButton = this.createRewriteButton(replyBox)
    rewriteButton.style.display = 'none'

    // Add elements to container
    container.appendChild(toneSelector)
    container.appendChild(generateButton)
    container.appendChild(rewriteButton)

    // Insert container after the reply box
    const replyContainer = replyBox.closest('[data-testid*="tweet"]') || replyBox.parentElement
    if (replyContainer) {
      replyContainer.appendChild(container)
    }
  }

  private createToneSelector(): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      margin-bottom: 8px;
    `

    const label = document.createElement('div')
    label.textContent = '🎯 Reply Tone:'
    label.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #14171a;
      margin-bottom: 4px;
    `

    const toneButtons = document.createElement('div')
    toneButtons.style.cssText = `
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    `

    const tones = [
      { value: 'Smart', emoji: '🧠', label: 'Smart' },
      { value: 'Funny', emoji: '😂', label: 'Funny' },
      { value: 'Serious', emoji: '💼', label: 'Serious' },
      { value: 'Degen', emoji: '🚀', label: 'Degen' }
    ]

    tones.forEach((tone, index) => {
      const button = document.createElement('button')
      button.className = `agentyap-tone-btn ${index === 0 ? 'selected' : ''}`
      button.dataset.tone = tone.value
      button.innerHTML = `${tone.emoji} ${tone.label}`
      button.style.cssText = `
        padding: 4px 8px;
        border: 1px solid #ccd6dd;
        border-radius: 12px;
        background: ${index === 0 ? '#1da1f2' : 'white'};
        color: ${index === 0 ? 'white' : '#14171a'};
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      `

      button.addEventListener('click', () => {
        // Update selection
        toneButtons.querySelectorAll('.agentyap-tone-btn').forEach(btn => {
          btn.classList.remove('selected')
          ;(btn as HTMLElement).style.background = 'white'
          ;(btn as HTMLElement).style.color = '#14171a'
        })
        button.classList.add('selected')
        button.style.background = '#1da1f2'
        button.style.color = 'white'
      })

      button.addEventListener('mouseenter', () => {
        if (!button.classList.contains('selected')) {
          button.style.background = '#f0f8ff'
        }
      })

      button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('selected')) {
          button.style.background = 'white'
        }
      })

      toneButtons.appendChild(button)
    })

    container.appendChild(label)
    container.appendChild(toneButtons)
    return container
  }

  private createGenerateButton(replyBox: HTMLElement, tweetText: string): HTMLElement {
    const button = document.createElement('button')
    button.className = 'agentyap-generate-btn'
    button.innerHTML = '✨ Generate AI Reply'
    button.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: linear-gradient(135deg, #1da1f2, #0d8bd9);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 8px;
    `

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)'
      button.style.boxShadow = '0 4px 8px rgba(29, 161, 242, 0.3)'
    })

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)'
      button.style.boxShadow = 'none'
    })

    button.addEventListener('click', async () => {
      if (!this.isContextValid || !chrome?.runtime?.id) {
        button.style.background = '#ef4444'
        button.innerHTML = '❌ Extension Error'
        setTimeout(() => {
          button.style.background = 'linear-gradient(135deg, #1da1f2, #0d8bd9)'
          button.innerHTML = '✨ Generate AI Reply'
        }, 3000)
        return
      }

      // Get selected tone
      const container = button.closest('.agentyap-container')
      const selectedTone = (container?.querySelector('.agentyap-tone-btn.selected') as HTMLElement)?.dataset.tone || 'Smart'

      // Show loading state
      button.style.background = '#0d8bd9'
      button.innerHTML = '⏳ Generating...'
      button.disabled = true

      try {
        // Generate the reply
        const reply = await generateReply(tweetText, selectedTone)
        
        // Fill the reply box
        this.fillReplyBox(replyBox, reply)
        
        // Success feedback
        button.style.background = '#10b981'
        button.innerHTML = '✅ Reply Generated!'
        button.disabled = false
        
        // Show rewrite button
        const rewriteButton = container?.querySelector('.agentyap-rewrite-btn') as HTMLElement
        if (rewriteButton) {
          rewriteButton.style.display = 'block'
          rewriteButton.dataset.currentReply = reply
        }
        
      } catch (error) {
        console.error('Error generating reply:', error)
        button.style.background = '#ef4444'
        
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
          button.style.background = 'linear-gradient(135deg, #1da1f2, #0d8bd9)'
          button.innerHTML = '✨ Generate AI Reply'
        }, 5000)
      }
    })

    return button
  }

  private createRewriteButton(replyBox: HTMLElement): HTMLElement {
    const button = document.createElement('button')
    button.className = 'agentyap-rewrite-btn'
    button.innerHTML = '🔄 Rewrite Reply'
    button.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `

    button.addEventListener('mouseenter', () => {
      button.style.background = '#4b5563'
    })

    button.addEventListener('mouseleave', () => {
      button.style.background = '#6b7280'
    })

    button.addEventListener('click', async () => {
      if (!this.isContextValid || !chrome?.runtime?.id) {
        button.innerHTML = '🔄 Refresh Page'
        return
      }

      const currentReply = button.dataset.currentReply
      if (!currentReply) return

      button.innerHTML = '⏳ Rewriting...'
      button.disabled = true

      try {
        const newReply = await rewriteReply(currentReply)
        
        // Fill the reply box with new reply
        this.fillReplyBox(replyBox, newReply)
        
        button.innerHTML = '✅ Rewritten!'
        button.dataset.currentReply = newReply
        
        setTimeout(() => {
          button.innerHTML = '🔄 Rewrite Reply'
          button.disabled = false
        }, 2000)
        
      } catch (error) {
        console.error('Error rewriting reply:', error)
        button.innerHTML = '❌ Error'
        setTimeout(() => {
          button.innerHTML = '🔄 Rewrite Reply'
          button.disabled = false
        }, 3000)
      }
    })

    return button
  }

  private findTweetTextForReply(replyBox: HTMLElement): string | null {
    // Look for the tweet we're replying to
    // This could be in various places depending on Twitter's structure
    
    // Method 1: Look for tweet text in the same article
    let article = replyBox.closest('article')
    if (article) {
      const tweetTextElement = article.querySelector('[data-testid="tweetText"]')
      if (tweetTextElement?.textContent) {
        return tweetTextElement.textContent.trim()
      }
    }

    // Method 2: Look for tweet text in parent containers
    let container = replyBox.closest('[data-testid*="tweet"]')
    while (container && !container.matches('article')) {
      container = container.parentElement?.closest('[data-testid*="tweet"]') || null
    }
    
    if (container) {
      const tweetTextElement = container.querySelector('[data-testid="tweetText"]')
      if (tweetTextElement?.textContent) {
        return tweetTextElement.textContent.trim()
      }
    }

    // Method 3: Look for any tweet text in the vicinity
    const allTweetTexts = document.querySelectorAll('[data-testid="tweetText"]')
    if (allTweetTexts.length > 0) {
      // Return the last one found (most likely the one being replied to)
      const lastTweet = allTweetTexts[allTweetTexts.length - 1]
      if (lastTweet.textContent) {
        return lastTweet.textContent.trim()
      }
    }

    // Method 4: Look for any text content in lang attribute elements
    const langElements = document.querySelectorAll('[lang]')
    for (const element of langElements) {
      if (element.textContent && element.textContent.trim().length > 10) {
        return element.textContent.trim()
      }
    }

    return null
  }

  private fillReplyBox(replyBox: HTMLElement, text: string) {
    // Focus the reply box
    replyBox.focus()

    // Clear existing content
    if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
      (replyBox as HTMLInputElement).value = text
    } else {
      replyBox.textContent = text
      replyBox.innerHTML = text
    }

    // Dispatch events to notify Twitter
    const events = [
      new Event('focus', { bubbles: true }),
      new Event('input', { bubbles: true }),
      new InputEvent('input', { 
        bubbles: true, 
        inputType: 'insertText',
        data: text
      }),
      new Event('change', { bubbles: true }),
      new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
      new KeyboardEvent('keyup', { bubbles: true, key: 'a' })
    ]

    events.forEach(event => {
      try {
        replyBox.dispatchEvent(event)
      } catch (e) {
        console.warn('Could not dispatch event:', e)
      }
    })

    // Keep focus on the reply box
    replyBox.focus()
  }

  public destroy() {
    this.isContextValid = false
    
    if (this.observer) {
      this.observer.disconnect()
    }
    
    if (this.replyBoxObserver) {
      this.replyBoxObserver.disconnect()
    }
    
    // Remove all injected controls
    document.querySelectorAll('.agentyap-container').forEach(container => container.remove())
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