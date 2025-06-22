export interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  tone: 'Smart' | 'Funny' | 'Serious' | 'Degen';
  tags: string[];
  usageCount: number;
  createdAt: string;
  lastUsed?: string;
  isFavorite: boolean;
}

export interface ReplyHistory {
  id: string;
  originalTweet: string;
  generatedReply: string;
  tone: string;
  timestamp: string;
  tweetAuthor: string;
  performance?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: ReplyTemplate[];
}
