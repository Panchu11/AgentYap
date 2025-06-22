/// <reference types="chrome"/>

export class SafetyManager {
  private static readonly MIN_DELAY_BETWEEN_REPLIES = 2 * 60 * 1000; // 2 minutes
  private static readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
  private static readonly MAX_REPLIES_PER_WINDOW = 30;
  private static readonly DAILY_RESET_HOUR = 0; // Reset at midnight

  private replyHistory: number[] = [];
  private dailyReplyCount: number = 0;
  private lastResetDate: string = '';

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get(['safetyManagerData']);
        if (result.safetyManagerData) {
          const data = result.safetyManagerData;
          this.replyHistory = data.replyHistory || [];
          this.dailyReplyCount = data.dailyReplyCount || 0;
          this.lastResetDate = data.lastResetDate || '';
          
          // Check if we need to reset daily count
          this.checkDailyReset();
        }
      }
    } catch (error) {
      console.warn('Failed to load safety manager data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({
          safetyManagerData: {
            replyHistory: this.replyHistory,
            dailyReplyCount: this.dailyReplyCount,
            lastResetDate: this.lastResetDate
          }
        });
      }
    } catch (error) {
      console.warn('Failed to save safety manager data:', error);
    }
  }

  private checkDailyReset(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyReplyCount = 0;
      this.lastResetDate = today;
      this.saveToStorage();
    }
  }

  public canSendReply(maxDailyReplies: number): boolean {
    this.checkDailyReset();
    
    const now = Date.now();
    
    // Clean old history (remove entries older than rate limit window)
    this.replyHistory = this.replyHistory.filter(
      timestamp => now - timestamp < SafetyManager.RATE_LIMIT_WINDOW
    );

    // Check daily limit
    if (this.dailyReplyCount >= maxDailyReplies) {
      return false;
    }

    // Check hourly rate limits
    if (this.replyHistory.length >= SafetyManager.MAX_REPLIES_PER_WINDOW) {
      return false;
    }

    // Check minimum delay between replies
    const lastReply = this.replyHistory[this.replyHistory.length - 1];
    if (lastReply && now - lastReply < SafetyManager.MIN_DELAY_BETWEEN_REPLIES) {
      return false;
    }

    return true;
  }

  public async recordReply(): Promise<void> {
    const now = Date.now();
    this.replyHistory.push(now);
    this.dailyReplyCount++;
    await this.saveToStorage();
  }

  public getStats(): {
    dailyReplies: number;
    hourlyReplies: number;
    timeUntilNextReply: number;
  } {
    this.checkDailyReset();
    
    const now = Date.now();
    const hourlyReplies = this.replyHistory.filter(
      timestamp => now - timestamp < SafetyManager.RATE_LIMIT_WINDOW
    ).length;

    const lastReply = this.replyHistory[this.replyHistory.length - 1];
    const timeUntilNextReply = lastReply 
      ? Math.max(0, SafetyManager.MIN_DELAY_BETWEEN_REPLIES - (now - lastReply))
      : 0;

    return {
      dailyReplies: this.dailyReplyCount,
      hourlyReplies,
      timeUntilNextReply
    };
  }

  public isWithinOperatingHours(startHour: number, endHour: number): boolean {
    const currentHour = new Date().getHours();
    
    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour <= endHour;
    } else {
      // Handle overnight hours (e.g., 22:00 to 06:00)
      return currentHour >= startHour || currentHour <= endHour;
    }
  }

  public async reset(): Promise<void> {
    this.replyHistory = [];
    this.dailyReplyCount = 0;
    this.lastResetDate = new Date().toDateString();
    await this.saveToStorage();
  }
}
