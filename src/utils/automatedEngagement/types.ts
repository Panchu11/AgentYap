export type EngagementRule = {
  id: string;
  name: string;
  keywords: string[];
  hashtags: string[];
  handles: string[];
  minEngagement: {
    likes: number;
    retweets: number;
  };
  tonePreference: 'Smart' | 'Funny' | 'Serious' | 'Degen';
  responseDelay: {
    min: number; // milliseconds
    max: number; // milliseconds
  };
  enabled: boolean;
}

export type AutomatedEngagementConfig = {
  enabled: boolean;
  maxDailyReplies: number;
  rules: EngagementRule[];
  blacklistedWords: string[];
  blacklistedHandles: string[];
  operatingHours: {
    start: number; // 0-23
    end: number; // 0-23
  };
}

export type EngagementStats = {
  dailyReplies: number;
  lastReplyTimestamp: number;
  successfulReplies: number;
  failedReplies: number;
  rulePerformance: Record<string, {
    replies: number;
    avgLikes: number;
    avgRetweets: number;
  }>;
}
