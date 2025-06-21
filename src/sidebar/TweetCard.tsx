import React, { useState } from 'react'
import { Tone } from './SidebarApp'

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

interface TweetCardProps {
  tweet: Tweet
  onGenerateReply: (tweet: Tweet, tone: Tone) => Promise<string>
  onRewriteReply: (originalReply: string) => Promise<string>
  onCopyToClipboard: (text: string) => Promise<boolean>
  onFillReplyBox: (tweet: Tweet, text: string) => Promise<boolean>
  apiKeyConfigured: boolean
}

const tones: { value: Tone; label: string; emoji: string }[] = [
  { value: 'Smart', label: 'Smart', emoji: '🧠' },
  { value: 'Funny', label: 'Funny', emoji: '😂' },
  { value: 'Serious', label: 'Serious', emoji: '💼' },
  { value: 'Degen', label: 'Degen', emoji: '🚀' }
]

function TweetCard({ 
  tweet, 
  onGenerateReply, 
  onRewriteReply, 
  onCopyToClipboard, 
  onFillReplyBox,
  apiKeyConfigured 
}: TweetCardProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('Smart')
  const [generatedReply, setGeneratedReply] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [fillSuccess, setFillSuccess] = useState(false)

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'now'
      if (diffMins < 60) return `${diffMins}m`
      if (diffHours < 24) return `${diffHours}h`
      if (diffDays < 7) return `${diffDays}d`
      return date.toLocaleDateString()
    } catch {
      return 'unknown'
    }
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const handleGenerateReply = async () => {
    if (!apiKeyConfigured) return

    setIsGenerating(true)
    try {
      const reply = await onGenerateReply(tweet, selectedTone)
      setGeneratedReply(reply)
    } catch (error) {
      console.error('Error generating reply:', error)
      // Show error state
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRewriteReply = async () => {
    if (!generatedReply || !apiKeyConfigured) return

    setIsRewriting(true)
    try {
      const newReply = await onRewriteReply(generatedReply)
      setGeneratedReply(newReply)
    } catch (error) {
      console.error('Error rewriting reply:', error)
    } finally {
      setIsRewriting(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedReply) return

    const success = await onCopyToClipboard(generatedReply)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleFillReplyBox = async () => {
    if (!generatedReply) return

    const success = await onFillReplyBox(tweet, generatedReply)
    if (success) {
      setFillSuccess(true)
      setTimeout(() => setFillSuccess(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Tweet Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">
              {tweet.author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{tweet.author}</div>
            <div className="text-xs text-gray-500">@{tweet.username}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500">{formatTimestamp(tweet.timestamp)}</div>
      </div>

      {/* Tweet Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-800 leading-relaxed">{tweet.text}</p>
      </div>

      {/* Tweet Metrics */}
      <div className="flex items-center space-x-4 mb-4 text-xs text-gray-500">
        <span>💬 {formatCount(tweet.replyCount)}</span>
        <span>🔄 {formatCount(tweet.retweetCount)}</span>
        <span>❤️ {formatCount(tweet.likeCount)}</span>
      </div>

      {/* Tone Selector */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">Reply Tone:</div>
        <div className="flex space-x-1">
          {tones.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedTone === tone.value
                  ? 'bg-twitter-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tone.emoji} {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateReply}
        disabled={isGenerating || !apiKeyConfigured}
        className="w-full bg-twitter-blue text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
      >
        {isGenerating ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
            <span>Generating...</span>
          </div>
        ) : (
          '✨ Generate AI Reply'
        )}
      </button>

      {/* Generated Reply */}
      {generatedReply && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-800 mb-2">Generated Reply:</div>
          <p className="text-sm text-green-700 mb-3 leading-relaxed">{generatedReply}</p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-green-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-green-700 transition-colors"
            >
              {copySuccess ? '✅ Copied!' : '📋 Copy'}
            </button>
            
            <button
              onClick={handleRewriteReply}
              disabled={isRewriting || !apiKeyConfigured}
              className="flex-1 bg-gray-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isRewriting ? '⏳ Rewriting...' : '🔄 Rewrite'}
            </button>
            
            {tweet.hasReplyBox && (
              <button
                onClick={handleFillReplyBox}
                className="flex-1 bg-blue-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                {fillSuccess ? '✅ Filled!' : '📝 Fill Reply'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TweetCard