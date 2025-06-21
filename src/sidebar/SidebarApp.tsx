import React, { useState, useEffect } from 'react'
import TweetList from './TweetList'
import Settings from './Settings'
import { generateReply } from '../utils/generateReply'
import { rewriteReply } from '../utils/rewriteReply'

export type Tone = 'Smart' | 'Funny' | 'Serious' | 'Degen'

interface Tweet {
  id: string
  text: string
  author: string
  username: string
  timestamp: string
  replyCount: number
  retweetCount: number
  likeCount: number
  hasReplyBox: boolean
}

interface AppState {
  tweets: Tweet[]
  currentView: 'main' | 'settings'
  isLoading: boolean
  apiKeyConfigured: boolean
  cryptoMode: boolean
  theme: 'light' | 'dark'
}

function SidebarApp() {
  const [state, setState] = useState<AppState>({
    tweets: [],
    currentView: 'main',
    isLoading: true,
    apiKeyConfigured: false,
    cryptoMode: true,
    theme: 'light'
  })

  useEffect(() => {
    // Check if API key is configured
    checkApiKey()

    // Load saved preferences
    loadPreferences()

    // Request initial tweets
    requestTweets()

    // Listen for tweet updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TWEETS_UPDATED') {
        setState(prev => ({
          ...prev,
          tweets: message.tweets,
          isLoading: false
        }))
      }
    })

    // Periodic refresh
    const interval = setInterval(() => {
      requestTweets()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadPreferences = async () => {
    try {
      const result = await chrome.storage.sync.get(['cryptoMode', 'theme'])
      setState(prev => ({
        ...prev,
        cryptoMode: result.cryptoMode !== undefined ? result.cryptoMode : true,
        theme: result.theme || 'light'
      }))
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const savePreferences = async (cryptoMode: boolean, theme: string) => {
    try {
      await chrome.storage.sync.set({ cryptoMode, theme })
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const checkApiKey = async () => {
    try {
      const result = await chrome.storage.sync.get(['fireworksApiKey'])
      setState(prev => ({
        ...prev,
        apiKeyConfigured: !!(result.fireworksApiKey && result.fireworksApiKey.trim())
      }))
    } catch (error) {
      console.error('Error checking API key:', error)
    }
  }

  const requestTweets = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_TWEETS' }, (response) => {
          if (response?.success) {
            setState(prev => ({
              ...prev,
              tweets: response.tweets,
              isLoading: false
            }))
          }
        })
      }
    } catch (error) {
      console.error('Error requesting tweets:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleGenerateReply = async (tweet: Tweet, tone: Tone): Promise<string> => {
    try {
      const reply = await generateReply(tweet.text, tone, state.cryptoMode)
      return reply
    } catch (error) {
      console.error('Error generating reply:', error)
      throw error
    }
  }

  const handleRewriteReply = async (originalReply: string): Promise<string> => {
    try {
      const newReply = await rewriteReply(originalReply)
      return newReply
    } catch (error) {
      console.error('Error rewriting reply:', error)
      throw error
    }
  }

  const handleCopyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  }

  const handleFillReplyBox = async (tweet: Tweet, text: string): Promise<boolean> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id!, { 
            type: 'FILL_REPLY_BOX', 
            tweetId: tweet.id,
            text 
          }, (response) => {
            resolve(response?.success || false)
          })
        })
      }
      return false
    } catch (error) {
      console.error('Error filling reply box:', error)
      return false
    }
  }

  const handleRefresh = () => {
    setState(prev => ({ ...prev, isLoading: true }))
    requestTweets()
  }

  const toggleCryptoMode = () => {
    const newCryptoMode = !state.cryptoMode
    setState(prev => ({ ...prev, cryptoMode: newCryptoMode }))
    savePreferences(newCryptoMode, state.theme)
  }

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    setState(prev => ({ ...prev, theme: newTheme }))
    savePreferences(state.cryptoMode, newTheme)
  }

  if (state.currentView === 'settings') {
    return (
      <div className={`h-full flex flex-col ${state.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center shadow-lg">
          <button 
            onClick={() => setState(prev => ({ ...prev, currentView: 'main' }))}
            className="mr-3 hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
          >
            ←
          </button>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
        <Settings onApiKeyUpdated={checkApiKey} theme={state.theme} />
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${state.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold flex items-center">
              💬 YapMate
              <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                v2.0
              </span>
            </h1>
            <p className="text-xs opacity-90">AI Twitter Replies</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleRefresh}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              disabled={state.isLoading}
            >
              <div className={`${state.isLoading ? 'animate-spin' : ''}`}>
                🔄
              </div>
            </button>
            <button 
              onClick={toggleTheme}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              {state.theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, currentView: 'settings' }))}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Crypto Mode Toggle */}
        <div className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {state.cryptoMode ? '₿ Crypto Mode' : '💬 General Mode'}
            </span>
            <span className="text-xs opacity-75">
              {state.cryptoMode ? 'Crypto-focused replies' : 'General topic replies'}
            </span>
          </div>
          <button
            onClick={toggleCryptoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              state.cryptoMode ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                state.cryptoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* API Key Warning */}
      {!state.apiKeyConfigured && (
        <div className={`border-l-4 border-red-500 p-3 m-4 rounded-lg ${
          state.theme === 'dark' ? 'bg-red-900 bg-opacity-20' : 'bg-red-100'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${state.theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                Please configure your Fireworks API key in settings to use AI features.
              </p>
              <button 
                onClick={() => setState(prev => ({ ...prev, currentView: 'settings' }))}
                className={`underline text-sm mt-1 hover:no-underline transition-all ${
                  state.theme === 'dark' ? 'text-red-300' : 'text-red-700'
                }`}
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className={`text-sm ${state.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                Loading tweets...
              </p>
            </div>
          </div>
        ) : state.tweets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-4xl mb-4">🐦</div>
              <p className={`mb-2 ${state.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                No tweets found
              </p>
              <p className={`text-sm ${state.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                Make sure you're on X.com or Twitter.com
              </p>
              <button 
                onClick={handleRefresh}
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <TweetList
            tweets={state.tweets}
            onGenerateReply={handleGenerateReply}
            onRewriteReply={handleRewriteReply}
            onCopyToClipboard={handleCopyToClipboard}
            onFillReplyBox={handleFillReplyBox}
            apiKeyConfigured={state.apiKeyConfigured}
            cryptoMode={state.cryptoMode}
            theme={state.theme}
          />
        )}
      </div>

      {/* Footer */}
      <div className={`p-3 border-t text-center text-xs ${
        state.theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 text-gray-400' 
          : 'bg-white border-gray-200 text-gray-500'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          <span>{state.tweets.length} tweets</span>
          <span>•</span>
          <span>Powered by Fireworks AI</span>
          <span>•</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            state.cryptoMode 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {state.cryptoMode ? 'Crypto' : 'General'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default SidebarApp