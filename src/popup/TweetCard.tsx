import React, { useState } from 'react'

interface TweetCardProps {
  tweetText: string
  generatedReply: string | null
  isGenerating: boolean
  onGenerateReply: () => void
}

function TweetCard({ tweetText, generatedReply, isGenerating, onGenerateReply }: TweetCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!generatedReply) return
    
    try {
      await navigator.clipboard.writeText(generatedReply)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleRewrite = async () => {
    if (!generatedReply) return
    
    // Send message to content script to rewrite reply
    const response = await chrome.tabs.query({ active: true, currentWindow: true })
    if (response[0]?.id) {
      chrome.tabs.sendMessage(response[0].id, {
        type: 'REWRITE_REPLY',
        originalReply: generatedReply
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Original Tweet */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Tweet</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{tweetText}</p>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerateReply}
        disabled={isGenerating}
        className="w-full bg-twitter-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Generating...</span>
          </div>
        ) : (
          '✨ Generate AI Reply'
        )}
      </button>

      {/* Generated Reply */}
      {generatedReply && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Generated Reply</h3>
          <p className="text-sm text-green-700 leading-relaxed mb-3">{generatedReply}</p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={handleRewrite}
              className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              🔄 Rewrite
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TweetCard