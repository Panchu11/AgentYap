import { generateReply } from '../utils/generateReply'
import { rewriteReply } from '../utils/rewriteReply'

class AgentYapInjector {
  private observer: MutationObserver | null = null
  private isContextValid = true
  private injectedContainers = new Set<string>()

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

    // Set up mutation observer to watch for reply boxes
    this.observer = new MutationObserver((mutations) => {
      if (!this.isContextValid) return

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for new reply boxes
          setTimeout(() => this.checkForReplyBoxes(), 100)
        }
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Initial check
    this.checkForReplyBoxes()
  }

  private checkForReplyBoxes() {
    // Look for reply textareas/compose boxes
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
        this.maybeInjectAIControls(replyBox as HTMLElement)
      })
    }
  }

  private maybeInjectAIControls(replyBox: HTMLElement) {
    // Create unique identifier for this reply box
    const boxId = this.getReplyBoxId(replyBox)
    
    // Skip if already injected
    if (this.injectedContainers.has(boxId)) {
      return
    }

    // Skip if this is not actually a reply box (could be main compose)
    if (!this.isReplyBox(replyBox)) {
      return
    }

    // Find the tweet we're replying to
    const tweetText = this.findTweetTextForReply(replyBox)
    if (!tweetText) {
      console.log('Could not find tweet text for reply box')
      return
    }

    console.log('Injecting AI controls for reply box:', boxId)
    console.log('Tweet text:', tweetText)

    // Inject AI controls
    this.injectAIControls(replyBox, tweetText, boxId)
    this.injectedContainers.add(boxId)
  }

  private getReplyBoxId(replyBox: HTMLElement): string {
    // Create a unique ID based on the element's position and attributes
    const rect = replyBox.getBoundingClientRect()
    const testId = replyBox.getAttribute('data-testid') || ''
    return `reply-${testId}-${Math.round(rect.top)}-${Math.round(rect.left)}`
  }

  private isReplyBox(replyBox: HTMLElement): boolean {
    // Check if this is actually a reply box and not the main compose box
    
    // Method 1: Look for reply-specific indicators
    const replyIndicators = [
      '[data-testid*="reply"]',
      '.css-1dbjc4n[data-testid*="reply"]',
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

    // Method 2: Check if we can find a tweet being replied to nearby
    const nearbyTweet = this.findTweetTextForReply(replyBox)
    if (nearbyTweet) {
      return true
    }

    // Method 3: Check URL for reply context
    if (window.location.href.includes('/status/') && window.location.href.includes('reply')) {
      return true
    }

    return false
  }

  private injectAIControls(replyBox: HTMLElement, tweetText: string, boxId: string) {
    // Create container for our AI controls
    const container = document.createElement('div')
    container.className = 'agentyap-container'
    container.dataset.boxId = boxId
    container.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    `

    // Create header
    const header = document.createElement('div')
    header.innerHTML = '🤖 <strong>YapMate AI</strong>'
    header.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    `

    // Create tone selector
    const toneSelector = this.createToneSelector()
    
    // Create generate button
    const generateButton = this.createGenerateButton(replyBox, tweetText)
    
    // Create rewrite button (initially hidden)
    const rewriteButton = this.createRewriteButton(replyBox)
    rewriteButton.style.display = 'none'

    // Add elements to container
    container.appendChild(header)
    container.appendChild(toneSelector)
    container.appendChild(generateButton)
    container.appendChild(rewriteButton)

    // Find the best place to insert the container
    const insertionPoint = this.findInsertionPoint(replyBox)
    if (insertionPoint) {
      insertionPoint.appendChild(container)
    }
  }

  private findInsertionPoint(replyBox: HTMLElement): HTMLElement | null {
    // Try to find the reply container or compose area
    let container = replyBox.parentElement
    let depth = 0
    
    while (container && depth < 8) {
      // Look for common Twitter reply container patterns
      if (container.querySelector('[data-testid*="reply"]') ||
          container.querySelector('[role="button"][data-testid*="tweet"]') ||
          container.matches('[data-testid*="reply"]')) {
        return container
      }
      container = container.parentElement
      depth++
    }

    // Fallback: use the direct parent
    return replyBox.parentElement
  }

  private createToneSelector(): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      margin-bottom: 10px;
    `

    const label = document.createElement('div')
    label.textContent = '🎯 Tone:'
    label.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    `

    const toneButtons = document.createElement('div')
    toneButtons.style.cssText = `
      display: flex;
      gap: 6px;
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
        padding: 6px 10px;
        border: 1px solid ${index === 0 ? '#1da1f2' : '#d1d5db'};
        border-radius: 16px;
        background: ${index === 0 ? '#1da1f2' : 'white'};
        color: ${index === 0 ? 'white' : '#374151'};
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
          ;(btn as HTMLElement).style.color = '#374151'
          ;(btn as HTMLElement).style.borderColor = '#d1d5db'
        })
        button.classList.add('selected')
        button.style.background = '#1da1f2'
        button.style.color = 'white'
        button.style.borderColor = '#1da1f2'
      })

      button.addEventListener('mouseenter', () => {
        if (!button.classList.contains('selected')) {
          button.style.background = '#f3f4f6'
          button.style.borderColor = '#9ca3af'
        }
      })

      button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('selected')) {
          button.style.background = 'white'
          button.style.borderColor = '#d1d5db'
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
      padding: 10px 16px;
      background: linear-gradient(135deg, #1da1f2, #0d8bd9);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 8px;
    `

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)'
      button.style.boxShadow = '0 4px 12px rgba(29, 161, 242, 0.3)'
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
        
        // Fill the reply box with enhanced method
        await this.fillReplyBoxEnhanced(replyBox, reply)
        
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
      padding: 8px 16px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 8px;
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
        
        // Fill the reply box with new reply using enhanced method
        await this.fillReplyBoxEnhanced(replyBox, newReply)
        
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
    // Method 1: Look for tweet text in the same article/container
    let container = replyBox.closest('article')
    if (container) {
      const tweetTextElement = container.querySelector('[data-testid="tweetText"]')
      if (tweetTextElement?.textContent) {
        return tweetTextElement.textContent.trim()
      }
    }

    // Method 2: Look for tweet text in parent containers
    container = replyBox.closest('[data-testid*="tweet"]')
    while (container && !container.matches('article')) {
      container = container.parentElement?.closest('[data-testid*="tweet"]') || null
    }
    
    if (container) {
      const tweetTextElement = container.querySelector('[data-testid="tweetText"]')
      if (tweetTextElement?.textContent) {
        return tweetTextElement.textContent.trim()
      }
    }

    // Method 3: Look for the most recent tweet text on the page
    const allTweetTexts = document.querySelectorAll('[data-testid="tweetText"]')
    if (allTweetTexts.length > 0) {
      // Find the tweet text that's closest to our reply box
      let closestTweet: HTMLElement | null = null
      let closestDistance = Infinity
      
      const replyRect = replyBox.getBoundingClientRect()
      
      allTweetTexts.forEach(tweetElement => {
        const tweetRect = tweetElement.getBoundingClientRect()
        const distance = Math.abs(tweetRect.bottom - replyRect.top)
        
        if (distance < closestDistance && tweetRect.top < replyRect.top) {
          closestDistance = distance
          closestTweet = tweetElement as HTMLElement
        }
      })
      
      if (closestTweet?.textContent) {
        return closestTweet.textContent.trim()
      }
    }

    // Method 4: Look for any text content in lang attribute elements
    const langElements = document.querySelectorAll('[lang]')
    for (const element of langElements) {
      if (element.textContent && element.textContent.trim().length > 20) {
        const rect = element.getBoundingClientRect()
        const replyRect = replyBox.getBoundingClientRect()
        
        // Only consider elements that are above the reply box
        if (rect.bottom < replyRect.top) {
          return element.textContent.trim()
        }
      }
    }

    return null
  }

  private async fillReplyBoxEnhanced(replyBox: HTMLElement, text: string): Promise<void> {
    console.log('Filling reply box with enhanced method:', text)
    
    // Step 1: Focus and clear
    replyBox.focus()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear existing content
    if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
      (replyBox as HTMLInputElement).value = ''
    } else {
      replyBox.textContent = ''
      replyBox.innerHTML = ''
    }

    // Step 2: Set content using multiple methods
    if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
      (replyBox as HTMLInputElement).value = text
    } else {
      replyBox.textContent = text
      replyBox.innerHTML = text
    }

    // Step 3: Simulate realistic typing to trigger all React events
    await this.simulateTypingSequence(replyBox, text)

    // Step 4: Trigger comprehensive event sequence
    await this.triggerComprehensiveEvents(replyBox, text)

    // Step 5: Force Twitter to recognize the content
    await this.forceTwitterRecognition(replyBox, text)

    console.log('Reply box filled successfully')
  }

  private async simulateTypingSequence(replyBox: HTMLElement, text: string): Promise<void> {
    // Clear first
    if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
      (replyBox as HTMLInputElement).value = ''
    } else {
      replyBox.textContent = ''
      replyBox.innerHTML = ''
    }

    // Type character by character
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      // Update content
      if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
        (replyBox as HTMLInputElement).value += char
      } else {
        replyBox.textContent += char
        replyBox.innerHTML = replyBox.textContent || ''
      }

      // Dispatch input event for each character
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: char
      })
      replyBox.dispatchEvent(inputEvent)

      // Add small delay every few characters
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
  }

  private async triggerComprehensiveEvents(replyBox: HTMLElement, text: string): Promise<void> {
    const events = [
      // Basic events
      new Event('focus', { bubbles: true }),
      new Event('input', { bubbles: true }),
      new InputEvent('input', { 
        bubbles: true, 
        inputType: 'insertText',
        data: text
      }),
      new Event('change', { bubbles: true }),
      
      // Keyboard events
      new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
      new KeyboardEvent('keyup', { bubbles: true, key: 'a' }),
      new KeyboardEvent('keypress', { bubbles: true, key: 'a' }),
      
      // Composition events
      new Event('compositionstart', { bubbles: true }),
      new Event('compositionend', { bubbles: true }),
      
      // Other events
      new Event('paste', { bubbles: true }),
      new Event('textInput', { bubbles: true }),
      
      // Space key to trigger character count
      new KeyboardEvent('keydown', { bubbles: true, key: ' ', code: 'Space' }),
      new KeyboardEvent('keyup', { bubbles: true, key: ' ', code: 'Space' })
    ]

    for (const event of events) {
      try {
        replyBox.dispatchEvent(event)
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (e) {
        console.warn('Could not dispatch event:', e)
      }
    }
  }

  private async forceTwitterRecognition(replyBox: HTMLElement, text: string): Promise<void> {
    // Method 1: Trigger React's internal state update
    const reactKey = Object.keys(replyBox).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'))
    if (reactKey) {
      try {
        const reactInstance = (replyBox as any)[reactKey]
        if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
          reactInstance.memoizedProps.onChange({
            target: { value: text }
          })
        }
      } catch (e) {
        console.warn('Could not trigger React state update:', e)
      }
    }

    // Method 2: Simulate user interaction pattern
    replyBox.focus()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simulate a space key press to trigger character counting
    const spaceDown = new KeyboardEvent('keydown', {
      bubbles: true,
      key: ' ',
      code: 'Space',
      keyCode: 32,
      which: 32
    })
    const spaceUp = new KeyboardEvent('keyup', {
      bubbles: true,
      key: ' ',
      code: 'Space',
      keyCode: 32,
      which: 32
    })
    
    replyBox.dispatchEvent(spaceDown)
    await new Promise(resolve => setTimeout(resolve, 50))
    replyBox.dispatchEvent(spaceUp)

    // Method 3: Final input event with full text
    const finalInputEvent = new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: text
    })
    replyBox.dispatchEvent(finalInputEvent)

    // Method 4: Blur and refocus to trigger validation
    replyBox.blur()
    await new Promise(resolve => setTimeout(resolve, 100))
    replyBox.focus()

    // Method 5: Trigger change event
    const changeEvent = new Event('change', { bubbles: true })
    replyBox.dispatchEvent(changeEvent)
  }

  public destroy() {
    this.isContextValid = false
    
    if (this.observer) {
      this.observer.disconnect()
    }
    
    // Remove all injected controls
    document.querySelectorAll('.agentyap-container').forEach(container => container.remove())
    this.injectedContainers.clear()
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