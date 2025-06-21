import React, { useState, useEffect } from 'react'
import ToneSelector from './ToneSelector'
import TweetCard from './TweetCard'

export type Tone = 'Smart' | 'Funny' | 'Serious' | 'Degen'

interface AppState {
  selectedTone: Tone
  isGenerating: boolean
  currentTweet: string | null
  generatedReply: string | null
}

function App() {
  const [state, setState] = useState<AppState>({
    selectedTone: 'Smart',
    isGenerating: false,
    currentTweet: null,
    generatedReply: null
  })

  useEffect(() => {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TWEET_SELECTED') {
        setState(prev => ({
          ...prev,
          currentTweet: message.tweetText,
          generatedReply: null
        }))
      }
    })
  }, [])

  const handleToneChange = (tone: Tone) => {
    setState(prev => ({ ...prev, selectedTone: tone }))
  }

  const handleGenerateReply = async () => {
    if (!state.currentTweet) return

    setState(prev => ({ ...prev, isGenerating: true }))
    
    try {
      // Send message to content script to generate reply
      const response = await chrome.tabs.query({ active: true, currentWindow: true })
      if (response[0]?.id) {
        chrome.tabs.sendMessage(response[0].id, {
          type: 'GENERATE_REPLY',
          tweetText: state.currentTweet,
          tone: state.selectedTone
        })
      }
    } catch (error) {
      console.error('Error generating reply:', error)
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }))
    }
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-twitter-blue text-white p-4 text-center">
        <h1 className="text-xl font-bold">💬 AgentYap</h1>
        <p className="text-sm opacity-90">AI-powered Twitter replies</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <ToneSelector 
          selectedTone={state.selectedTone}
          onToneChange={handleToneChange}
        />

        {state.currentTweet ? (
          <TweetCard
            tweetText={state.currentTweet}
            generatedReply={state.generatedReply}
            isGenerating={state.isGenerating}
            onGenerateReply={handleGenerateReply}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🐦</div>
            <p>Click "💬 Reply with AI" on any tweet to get started!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white text-center text-xs text-gray-500">
        Powered by OpenRouter & Gemini 2.0
      </div>
    </div>
  )
}

export default App