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
}

function SidebarApp() {
  const [state, setState] = useState<AppState>({
    tweets: [],
    currentView: 'main',
    isLoading: true,
    apiKeyConfigured: false
  })

  useEffect(() => {
    // Check if API key is configured
    checkApiKey()

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
      const reply = await generateReply(tweet.text, tone)
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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id!, { 
            type: 'COPY_TO_CLIPBOARD', 
            text 
          }, (response) => {
            resolve(response?.success || false)
          })
        })
      }
      return false
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

  if (state.currentView === 'settings') {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-twitter-blue text-white p-4 flex items-center">
          <button 
            onClick={() => setState(prev => ({ ...prev, currentView: 'main' }))}
            className="mr-3 hover:bg-blue-600 p-1 rounded"
          >
            ←
          </button>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
        <Settings onApiKeyUpdated={checkApiKey} />
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-twitter-blue text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">💬 YapMate</h1>
          <p className="text-xs opacity-90">AI Twitter Replies</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="hover:bg-blue-600 p-2 rounded text-sm"
            disabled={state.isLoading}
          >
            {state.isLoading ? '⏳' : '🔄'}
          </button>
          <button 
            onClick={() => setState(prev => ({ ...prev, currentView: 'settings' }))}
            className="hover:bg-blue-600 p-2 rounded"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* API Key Warning */}
      {!state.apiKeyConfigured && (
        <div className="bg-red-100 border-l-4 border-red-500 p-3 m-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Please configure your Fireworks API key in settings to use AI features.
              </p>
              <button 
                onClick={() => setState(prev => ({ ...prev, currentView: 'settings' }))}
                className="text-red-700 underline text-sm mt-1"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twitter-blue mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading tweets...</p>
            </div>
          </div>
        ) : state.tweets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-4xl mb-4">🐦</div>
              <p className="text-gray-500 mb-2">No tweets found</p>
              <p className="text-gray-400 text-sm">Make sure you're on X.com or Twitter.com</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 bg-twitter-blue text-white px-4 py-2 rounded hover:bg-blue-600"
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
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-white text-center text-xs text-gray-500">
        {state.tweets.length} tweets • Powered by Fireworks AI
      </div>
    </div>
  )
}

export default SidebarApp