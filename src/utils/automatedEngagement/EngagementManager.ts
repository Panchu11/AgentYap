import { AutomatedEngagementConfig, EngagementRule, EngagementStats } from './types';
import { SafetyManager } from './SafetyManager';
import { generateReply } from '../generateReply';

export class EngagementManager {
  private config: AutomatedEngagementConfig;
  private safetyManager: SafetyManager;
  private stats: EngagementStats;

  constructor(config: AutomatedEngagementConfig) {
    this.config = config;
    this.safetyManager = new SafetyManager();
    this.stats = {
      dailyReplies: 0,
      lastReplyTimestamp: 0,
      successfulReplies: 0,
      failedReplies: 0,
      rulePerformance: {}
    };
    this.loadStats();
  }

  private async loadStats(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['engagementStats']);
      if (result.engagementStats) {
        this.stats = result.engagementStats;
      }
    } catch (error) {
      console.warn('Failed to load engagement stats:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await chrome.storage.local.set({ engagementStats: this.stats });
    } catch (error) {
      console.warn('Failed to save engagement stats:', error);
    }
  }

  private matchesRule(tweet: { text: string; author: string }, rule: EngagementRule): boolean {
    // Check for blacklisted words
    if (this.config.blacklistedWords.some(word => 
      tweet.text.toLowerCase().includes(word.toLowerCase())
    )) {
      return false;
    }

    // Check for blacklisted handles
    if (this.config.blacklistedHandles.includes(tweet.author)) {
      return false;
    }

    // Check if tweet matches rule criteria
    const tweetText = tweet.text.toLowerCase();
    
    // Check keywords
    const hasKeyword = rule.keywords.length === 0 || 
      rule.keywords.some(keyword => tweetText.includes(keyword.toLowerCase()));
    
    // Check hashtags
    const hasHashtag = rule.hashtags.length === 0 ||
      rule.hashtags.some(hashtag => tweetText.includes(hashtag.toLowerCase()));
    
    // Check handles
    const hasHandle = rule.handles.length === 0 ||
      rule.handles.some(handle => tweetText.includes(handle.toLowerCase()));

    return hasKeyword && hasHashtag && hasHandle;
  }

  public async processTweet(tweet: {
    id: string;
    text: string;
    author: string;
    replyCount: number;
    retweetCount: number;
    likeCount: number;
  }): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check operating hours
    if (!this.safetyManager.isWithinOperatingHours(
      this.config.operatingHours.start,
      this.config.operatingHours.end
    )) {
      return null;
    }

    // Find matching rule
    const matchingRule = this.config.rules.find(rule => 
      rule.enabled && 
      this.matchesRule(tweet, rule) &&
      tweet.likeCount >= rule.minEngagement.likes &&
      tweet.retweetCount >= rule.minEngagement.retweets
    );

    if (!matchingRule) {
      return null;
    }

    // Check safety limits
    if (!this.safetyManager.canSendReply(this.config.maxDailyReplies)) {
      return null;
    }

    try {
      // Generate and record reply
      const reply = await generateReply(tweet.text, matchingRule.tonePreference);
      
      // Add random delay within rule's range
      const delay = Math.random() * 
        (matchingRule.responseDelay.max - matchingRule.responseDelay.min) +
        matchingRule.responseDelay.min;
      
      await new Promise(resolve => setTimeout(resolve, delay));

      // Update stats
      this.stats.successfulReplies++;
      this.stats.lastReplyTimestamp = Date.now();
      
      if (!this.stats.rulePerformance[matchingRule.id]) {
        this.stats.rulePerformance[matchingRule.id] = {
          replies: 0,
          avgLikes: 0,
          avgRetweets: 0
        };
      }
      this.stats.rulePerformance[matchingRule.id].replies++;
      
      await this.saveStats();
      await this.safetyManager.recordReply();

      return reply;
    } catch (error) {
      console.error('Failed to process tweet:', error);
      this.stats.failedReplies++;
      await this.saveStats();
      return null;
    }
  }

  public getStats(): EngagementStats {
    return { ...this.stats };
  }

  public updateConfig(newConfig: Partial<AutomatedEngagementConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  public async reset(): Promise<void> {
    this.stats = {
      dailyReplies: 0,
      lastReplyTimestamp: 0,
      successfulReplies: 0,
      failedReplies: 0,
      rulePerformance: {}
    };
    await this.saveStats();
    await this.safetyManager.reset();
  }
}
