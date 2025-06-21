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
}

function TweetList({ 
  tweets, 
  onGenerateReply, 
  onRewriteReply, 
  onCopyToClipboard, 
  onFillReplyBox,
  apiKeyConfigured 
}: TweetListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            onGenerateReply={onGenerateReply}
            onRewriteReply={onRewriteReply}
            onCopyToClipboard={onCopyToClipboard}
            onFillReplyBox={onFillReplyBox}
            apiKeyConfigured={apiKeyConfigured}
          />
        ))}
      </div>
    </div>
  )
}

export default TweetList