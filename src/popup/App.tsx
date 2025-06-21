import React, { useState, useEffect } from 'react'
import ToneSelector from './ToneSelector'
import TweetCard from './TweetCard'
import Settings from './Settings'

export type Tone = 'Smart' | 'Funny' | 'Serious' | 'Degen'

interface AppState {
  selectedTone: Tone
  isGenerating: boolean
  currentTweet: string | null
  generatedReply: string | null
  currentView: 'main' | 'settings'
}

function App() {
  const [state, setState] = useState<AppState>({
    selectedTone: 'Smart',
    isGenerating: false,
    currentTweet: null,
    generatedReply: null,
    currentView: 'main'
  })

  useEffect(() => {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TWEET_SELECTED') {
        setState(prev => ({
          ...prev,
          currentTweet: message.tweetText,
          generatedReply: null,
          currentView: 'main'
        }))
      } else if (message.type === 'REPLY_GENERATED') {
        setState(prev => ({
          ...prev,
          generatedReply: message.reply,
          isGenerating: false
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
      setState(prev => ({ ...prev, isGenerating: false }))
    }
  }

  if (state.currentView === 'settings') {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col">
        <div className="bg-twitter-blue text-white p-4 flex items-center">
          <button 
            onClick={() => setState(prev => ({ ...prev, currentView: 'main' }))}
            className="mr-3 hover:bg-blue-600 p-1 rounded"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <Settings />
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-twitter-blue text-white p-4 flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold">💬 AgentYap</h1>
          <p className="text-sm opacity-90">AI-powered Twitter replies</p>
        </div>
        <button 
          onClick={() => setState(prev => ({ ...prev, currentView: 'settings' }))}
          className="hover:bg-blue-600 p-2 rounded"
        >
          ⚙️
        </button>
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
            <p className="text-xs mt-2">Make sure to configure your API key in settings first.</p>
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