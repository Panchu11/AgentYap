import React, { useState, useEffect } from 'react'
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
  cryptoMode: boolean
  theme: 'light' | 'dark'
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
  apiKeyConfigured,
  cryptoMode,
  theme
}: TweetCardProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('Smart')
  const [generatedReply, setGeneratedReply] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [fillSuccess, setFillSuccess] = useState(false)
  const [displayedReply, setDisplayedReply] = useState('')
  const [isTyping, setIsTyping] = useState(false)

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

  // Typewriter effect for generated replies
  useEffect(() => {
    if (generatedReply && generatedReply !== displayedReply) {
      setIsTyping(true)
      setDisplayedReply('')
      
      let index = 0
      const timer = setInterval(() => {
        if (index < generatedReply.length) {
          setDisplayedReply(generatedReply.slice(0, index + 1))
          index++
        } else {
          setIsTyping(false)
          clearInterval(timer)
        }
      }, 30) // Adjust speed here

      return () => clearInterval(timer)
    }
  }, [generatedReply])

  const handleGenerateReply = async () => {
    if (!apiKeyConfigured) return

    setIsGenerating(true)
    setGeneratedReply(null)
    setDisplayedReply('')
    
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

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
  const textMuted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`${cardBg} rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-4 transform hover:scale-[1.02]`}>
      {/* Tweet Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">
              {tweet.author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className={`font-semibold text-sm ${textPrimary}`}>{tweet.author}</div>
            <div className={`text-xs ${textMuted}`}>@{tweet.username}</div>
          </div>
        </div>
        <div className={`text-xs ${textMuted} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full`}>
          {formatTimestamp(tweet.timestamp)}
        </div>
      </div>

      {/* Tweet Content */}
      <div className="mb-4">
        <p className={`text-sm ${textSecondary} leading-relaxed`}>{tweet.text}</p>
      </div>

      {/* Tweet Metrics */}
      <div className={`flex items-center space-x-4 mb-4 text-xs ${textMuted}`}>
        <span className="flex items-center space-x-1">
          <span>💬</span>
          <span>{formatCount(tweet.replyCount)}</span>
        </span>
        <span className="flex items-center space-x-1">
          <span>🔄</span>
          <span>{formatCount(tweet.retweetCount)}</span>
        </span>
        <span className="flex items-center space-x-1">
          <span>❤️</span>
          <span>{formatCount(tweet.likeCount)}</span>
        </span>
        {cryptoMode && (
          <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
            ₿ Crypto Mode
          </span>
        )}
      </div>

      {/* Tone Selector */}
      <div className="mb-4">
        <div className={`text-xs font-semibold ${textPrimary} mb-2`}>Reply Tone:</div>
        <div className="grid grid-cols-2 gap-2">
          {tones.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                selectedTone === tone.value
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{tone.emoji}</span>
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateReply}
        disabled={isGenerating || !apiKeyConfigured}
        className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4 ${
          apiKeyConfigured
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500'
        }`}
      >
        {isGenerating ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Generating...</span>
          </div>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <span>✨</span>
            <span>Generate AI Reply</span>
          </span>
        )}
      </button>

      {/* Generated Reply */}
      {(generatedReply || displayedReply) && (
        <div className={`rounded-xl p-4 border-2 ${
          theme === 'dark' 
            ? 'bg-green-900 bg-opacity-20 border-green-500 border-opacity-30' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 flex items-center space-x-2 ${
            theme === 'dark' ? 'text-green-300' : 'text-green-800'
          }`}>
            <span>🤖</span>
            <span>Generated Reply:</span>
            {isTyping && (
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
          <p className={`text-sm mb-3 leading-relaxed ${
            theme === 'dark' ? 'text-green-200' : 'text-green-700'
          }`}>
            {displayedReply}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopy}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                copySuccess
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                  ? 'bg-green-700 hover:bg-green-600 text-green-100'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {copySuccess ? (
                <span className="flex items-center justify-center space-x-1">
                  <span>✅</span>
                  <span>Copied!</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-1">
                  <span>📋</span>
                  <span>Copy</span>
                </span>
              )}
            </button>
            
            <button
              onClick={handleRewriteReply}
              disabled={isRewriting || !apiKeyConfigured}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isRewriting ? (
                <span className="flex items-center justify-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  <span>...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-1">
                  <span>🔄</span>
                  <span>Rewrite</span>
                </span>
              )}
            </button>
            
            {tweet.hasReplyBox && (
              <button
                onClick={handleFillReplyBox}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                  fillSuccess
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-blue-700 hover:bg-blue-600 text-blue-100'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {fillSuccess ? (
                  <span className="flex items-center justify-center space-x-1">
                    <span>✅</span>
                    <span>Filled!</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-1">
                    <span>📝</span>
                    <span>Fill</span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TweetCard