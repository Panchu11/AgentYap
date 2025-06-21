import React from 'react'
import TweetCard from './TweetCard'
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

interface TweetListProps {
  tweets: Tweet[]
  onGenerateReply: (tweet: Tweet, tone: Tone) => Promise<string>
  onRewriteReply: (originalReply: string) => Promise<string>
  onCopyToClipboard: (text: string) => Promise<boolean>
  onFillReplyBox: (tweet: Tweet, text: string) => Promise<boolean>
  apiKeyConfigured: boolean
  cryptoMode: boolean
  theme: 'light' | 'dark'
}

function TweetList({ 
  tweets, 
  onGenerateReply, 
  onRewriteReply, 
  onCopyToClipboard, 
  onFillReplyBox,
  apiKeyConfigured,
  cryptoMode,
  theme
}: TweetListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {tweets.map((tweet, index) => (
          <div
            key={tweet.id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <TweetCard
              tweet={tweet}
              onGenerateReply={onGenerateReply}
              onRewriteReply={onRewriteReply}
              onCopyToClipboard={onCopyToClipboard}
              onFillReplyBox={onFillReplyBox}
              apiKeyConfigured={apiKeyConfigured}
              cryptoMode={cryptoMode}
              theme={theme}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TweetList