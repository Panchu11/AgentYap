import { generateReply } from '../utils/generateReply'
import { rewriteReply } from '../utils/rewriteReply'

class AgentYapInjector {
  private observer: MutationObserver | null = null
  private isContextValid = true
  private injectedButtons = new Set<string>()

  constructor() {
    this.init()
  }

  private init() {
    if (!chrome?.runtime?.id) {
      console.warn('Extension context invalid, stopping initialization')
      return
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startObserving())
    } else {
      this.startObserving()
    }

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse)
      return true
    })

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
        case 'GENERATE_REPLY':
          try {
            const reply = await generateReply(message.tweetText, message.tone)
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

    this.observer = new MutationObserver((mutations) => {
      if (!this.isContextValid) return

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setTimeout(() => this.checkForReplyBoxes(), 300)
        }
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    this.checkForReplyBoxes()
  }

  private checkForReplyBoxes() {
    // Remove any orphaned buttons first
    this.cleanupOrphanedButtons()

    const replySelectors = [
      '[data-testid="tweetTextarea_0"]',
      '[data-testid="tweetTextarea_1"]', 
      '[role="textbox"][data-testid*="tweet"]',
      '.public-DraftEditor-content',
      '[contenteditable="true"][data-testid*="tweet"]'
    ]

    for (const selector of replySelectors) {
      const replyBoxes = document.querySelectorAll(selector)
      replyBoxes.forEach((replyBox) => {
        this.maybeInjectFloatingButton(replyBox as HTMLElement)
      })
    }
  }

  private cleanupOrphanedButtons() {
    const buttons = document.querySelectorAll('.yapmate-floating-btn')
    buttons.forEach(button => {
      const replyBoxId = button.getAttribute('data-reply-box-id')
      if (replyBoxId && !document.querySelector(`[data-yapmate-id="${replyBoxId}"]`)) {
        button.remove()
        this.injectedButtons.delete(replyBoxId)
      }
    })
  }

  private maybeInjectFloatingButton(replyBox: HTMLElement) {
    // Create unique ID for this reply box
    const boxId = this.createUniqueId(replyBox)
    
    // Skip if already injected
    if (this.injectedButtons.has(boxId)) {
      return
    }

    // Skip if not a real reply box
    if (!this.isReplyBox(replyBox)) {
      return
    }

    // Find tweet text
    const tweetText = this.findTweetTextForReply(replyBox)
    if (!tweetText) {
      return
    }

    // Mark the reply box with our ID
    replyBox.setAttribute('data-yapmate-id', boxId)

    // Create floating button
    this.createFloatingButton(replyBox, tweetText, boxId)
    this.injectedButtons.add(boxId)
  }

  private createUniqueId(replyBox: HTMLElement): string {
    const rect = replyBox.getBoundingClientRect()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `yapmate-${Math.round(rect.top)}-${Math.round(rect.left)}-${timestamp}-${random}`
  }

  private isReplyBox(replyBox: HTMLElement): boolean {
    // Simple checks to determine if this is a reply box
    
    // Check for reply indicators in the DOM
    const replyIndicators = [
      '[data-testid*="reply"]',
      '[aria-label*="reply"]',
      '[aria-label*="Reply"]'
    ]

    let container = replyBox.parentElement
    let depth = 0
    while (container && depth < 10) {
      for (const indicator of replyIndicators) {
        if (container.querySelector(indicator) || container.matches(indicator)) {
          return true
        }
      }
      container = container.parentElement
      depth++
    }

    // Check if we're in a modal (reply modal)
    if (replyBox.closest('[role="dialog"]')) {
      return true
    }

    // Check if we can find tweet text nearby
    const tweetText = this.findTweetTextForReply(replyBox)
    if (tweetText && tweetText.length > 10) {
      return true
    }

    return false
  }

  private createFloatingButton(replyBox: HTMLElement, tweetText: string, boxId: string) {
    // Create floating button
    const button = document.createElement('button')
    button.className = 'yapmate-floating-btn'
    button.setAttribute('data-reply-box-id', boxId)
    button.innerHTML = '🤖 AI'
    
    // Position the button relative to the reply box
    const rect = replyBox.getBoundingClientRect()
    
    button.style.cssText = `
      position: fixed;
      top: ${rect.top + window.scrollY - 5}px;
      right: ${window.innerWidth - rect.right + window.scrollX + 10}px;
      width: 40px;
      height: 30px;
      background: linear-gradient(135deg, #1da1f2, #0d8bd9);
      color: white;
      border: none;
      border-radius: 15px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)'
      button.style.boxShadow = '0 4px 12px rgba(29, 161, 242, 0.4)'
    })

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)'
      button.style.boxShadow = '0 2px 8px rgba(29, 161, 242, 0.3)'
    })

    // Handle click
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (!this.isContextValid || !chrome?.runtime?.id) {
        this.showError(button, 'Extension Error')
        return
      }

      // Show mini popup for tone selection
      this.showTonePopup(button, replyBox, tweetText)
    })

    // Update position on scroll
    const updatePosition = () => {
      const newRect = replyBox.getBoundingClientRect()
      if (newRect.width === 0 && newRect.height === 0) {
        // Reply box is gone, remove button
        button.remove()
        this.injectedButtons.delete(boxId)
        return
      }
      
      button.style.top = `${newRect.top + window.scrollY - 5}px`
      button.style.right = `${window.innerWidth - newRect.right + window.scrollX + 10}px`
    }

    // Listen for scroll and resize
    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    // Store cleanup function
    button.setAttribute('data-cleanup', 'true')

    document.body.appendChild(button)
  }

  private showTonePopup(button: HTMLElement, replyBox: HTMLElement, tweetText: string) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.yapmate-tone-popup')
    if (existingPopup) {
      existingPopup.remove()
    }

    // Create tone selection popup
    const popup = document.createElement('div')
    popup.className = 'yapmate-tone-popup'
    
    const buttonRect = button.getBoundingClientRect()
    
    popup.style.cssText = `
      position: fixed;
      top: ${buttonRect.bottom + 5}px;
      right: ${window.innerWidth - buttonRect.right}px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      padding: 8px;
      min-width: 120px;
    `

    const tones = [
      { value: 'Smart', emoji: '🧠', label: 'Smart' },
      { value: 'Funny', emoji: '😂', label: 'Funny' },
      { value: 'Serious', emoji: '💼', label: 'Serious' },
      { value: 'Degen', emoji: '🚀', label: 'Degen' }
    ]

    tones.forEach(tone => {
      const toneButton = document.createElement('button')
      toneButton.innerHTML = `${tone.emoji} ${tone.label}`
      toneButton.style.cssText = `
        width: 100%;
        padding: 6px 8px;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        font-size: 12px;
        margin-bottom: 2px;
        transition: background 0.2s ease;
      `

      toneButton.addEventListener('mouseenter', () => {
        toneButton.style.background = '#f3f4f6'
      })

      toneButton.addEventListener('mouseleave', () => {
        toneButton.style.background = 'transparent'
      })

      toneButton.addEventListener('click', async () => {
        popup.remove()
        await this.generateAndFillReply(button, replyBox, tweetText, tone.value)
      })

      popup.appendChild(toneButton)
    })

    // Close popup when clicking outside
    const closePopup = (e: Event) => {
      if (!popup.contains(e.target as Node) && !button.contains(e.target as Node)) {
        popup.remove()
        document.removeEventListener('click', closePopup)
      }
    }

    setTimeout(() => {
      document.addEventListener('click', closePopup)
    }, 100)

    document.body.appendChild(popup)
  }

  private async generateAndFillReply(button: HTMLElement, replyBox: HTMLElement, tweetText: string, tone: string) {
    // Show loading state
    button.innerHTML = '⏳'
    button.style.background = '#0d8bd9'

    try {
      const reply = await generateReply(tweetText, tone)
      
      // Fill the reply box
      await this.fillReplyBox(replyBox, reply)
      
      // Show success
      button.innerHTML = '✅'
      button.style.background = '#10b981'
      
      // Add rewrite button
      this.addRewriteButton(button, replyBox, reply)
      
      setTimeout(() => {
        button.innerHTML = '🤖 AI'
        button.style.background = 'linear-gradient(135deg, #1da1f2, #0d8bd9)'
      }, 2000)
      
    } catch (error) {
      console.error('Error generating reply:', error)
      this.showError(button, 'Error')
    }
  }

  private addRewriteButton(originalButton: HTMLElement, replyBox: HTMLElement, currentReply: string) {
    // Remove any existing rewrite button
    const existingRewrite = document.querySelector('.yapmate-rewrite-btn')
    if (existingRewrite) {
      existingRewrite.remove()
    }

    const rewriteButton = document.createElement('button')
    rewriteButton.className = 'yapmate-rewrite-btn'
    rewriteButton.innerHTML = '🔄'
    
    const originalRect = originalButton.getBoundingClientRect()
    
    rewriteButton.style.cssText = `
      position: fixed;
      top: ${originalRect.top}px;
      right: ${window.innerWidth - originalRect.left + 10}px;
      width: 30px;
      height: 30px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 15px;
      font-size: 11px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(107, 116, 128, 0.3);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    rewriteButton.addEventListener('click', async () => {
      rewriteButton.innerHTML = '⏳'
      rewriteButton.style.background = '#4b5563'

      try {
        const newReply = await rewriteReply(currentReply)
        await this.fillReplyBox(replyBox, newReply)
        
        rewriteButton.innerHTML = '✅'
        rewriteButton.style.background = '#10b981'
        
        // Update the current reply for next rewrite
        currentReply = newReply
        
        setTimeout(() => {
          rewriteButton.innerHTML = '🔄'
          rewriteButton.style.background = '#6b7280'
        }, 1500)
        
      } catch (error) {
        console.error('Error rewriting reply:', error)
        rewriteButton.innerHTML = '❌'
        rewriteButton.style.background = '#ef4444'
        
        setTimeout(() => {
          rewriteButton.innerHTML = '🔄'
          rewriteButton.style.background = '#6b7280'
        }, 2000)
      }
    })

    document.body.appendChild(rewriteButton)

    // Remove rewrite button after 10 seconds
    setTimeout(() => {
      rewriteButton.remove()
    }, 10000)
  }

  private showError(button: HTMLElement, message: string) {
    button.innerHTML = '❌'
    button.style.background = '#ef4444'
    
    setTimeout(() => {
      button.innerHTML = '🤖 AI'
      button.style.background = 'linear-gradient(135deg, #1da1f2, #0d8bd9)'
    }, 3000)
  }

  private async fillReplyBox(replyBox: HTMLElement, text: string): Promise<void> {
    // Focus the reply box
    replyBox.focus()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear existing content
    if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
      (replyBox as HTMLInputElement).value = ''
    } else {
      replyBox.textContent = ''
      replyBox.innerHTML = ''
    }

    // Set the new content
    if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
      (replyBox as HTMLInputElement).value = text
    } else {
      replyBox.textContent = text
      replyBox.innerHTML = text
    }

    // Trigger input events
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: text
    })
    replyBox.dispatchEvent(inputEvent)

    const changeEvent = new Event('change', { bubbles: true })
    replyBox.dispatchEvent(changeEvent)

    // Focus again to ensure Twitter recognizes the content
    replyBox.focus()
  }

  private findTweetTextForReply(replyBox: HTMLElement): string | null {
    // Method 1: Look in the same article
    let container = replyBox.closest('article')
    if (container) {
      const tweetTextElement = container.querySelector('[data-testid="tweetText"]')
      if (tweetTextElement?.textContent) {
        return tweetTextElement.textContent.trim()
      }
    }

    // Method 2: Look in modal dialogs
    const modalContainer = replyBox.closest('[role="dialog"]')
    if (modalContainer) {
      const tweetTextElement = modalContainer.querySelector('[data-testid="tweetText"]')
      if (tweetTextElement?.textContent) {
        return tweetTextElement.textContent.trim()
      }
    }

    // Method 3: Find closest tweet text on the page
    const allTweetTexts = document.querySelectorAll('[data-testid="tweetText"]')
    if (allTweetTexts.length > 0) {
      let closestTweet: HTMLElement | null = null
      let closestDistance = Infinity
      
      const replyRect = replyBox.getBoundingClientRect()
      
      Array.from(allTweetTexts).forEach(tweetElement => {
        if (tweetElement instanceof HTMLElement) {
          const tweetRect = tweetElement.getBoundingClientRect()
          const distance = Math.abs(tweetRect.bottom - replyRect.top)
          
          if (distance < closestDistance && tweetRect.top < replyRect.top) {
            closestDistance = distance
            closestTweet = tweetElement
          }
        }
      })
      
      if (closestTweet?.textContent) {
        return closestTweet.textContent.trim()
      }
    }

    return null
  }

  public destroy() {
    this.isContextValid = false
    
    if (this.observer) {
      this.observer.disconnect()
    }
    
    // Remove all floating buttons and popups
    document.querySelectorAll('.yapmate-floating-btn, .yapmate-tone-popup, .yapmate-rewrite-btn').forEach(element => {
      element.remove()
    })
    
    this.injectedButtons.clear()
  }
}

// Initialize the injector
if (chrome?.runtime?.id) {
  const injector = new AgentYapInjector()

  window.addEventListener('beforeunload', () => {
    injector.destroy()
  })

  chrome.runtime.onConnect.addListener(() => {
    console.log('Extension context restored')
  })
} else {
  console.warn('Extension context not available, skipping initialization')
}