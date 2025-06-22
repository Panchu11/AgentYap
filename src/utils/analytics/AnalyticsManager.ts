export interface AnalyticsEvent {
  id: string;
  type: 'reply_generated' | 'reply_used' | 'template_created' | 'template_used' | 'automation_triggered' | 'error_occurred';
  timestamp: string;
  data: Record<string, any>;
  sessionId: string;
}

export interface PerformanceMetrics {
  totalReplies: number;
  successfulReplies: number;
  failedReplies: number;
  averageResponseTime: number;
  apiUsage: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageLatency: number;
  };
  toneUsage: Record<string, number>;
  templateUsage: {
    totalUsed: number;
    topTemplates: Array<{ id: string; name: string; usageCount: number }>;
  };
  automationStats: {
    triggeredReplies: number;
    successRate: number;
    topRules: Array<{ id: string; name: string; triggers: number }>;
  };
}

export interface UserBehavior {
  sessionDuration: number;
  actionsPerSession: number;
  mostUsedFeatures: Array<{ feature: string; usage: number }>;
  timeOfDayUsage: Record<string, number>; // Hour of day -> usage count
  dayOfWeekUsage: Record<string, number>; // Day of week -> usage count
}

export class AnalyticsManager {
  private static readonly STORAGE_KEY = 'analyticsData';
  private static readonly SESSION_KEY = 'currentSession';
  private static readonly MAX_EVENTS = 1000; // Keep last 1000 events

  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.loadEvents();
    this.startSession();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadEvents(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([AnalyticsManager.STORAGE_KEY]);
      if (result[AnalyticsManager.STORAGE_KEY]) {
        this.events = result[AnalyticsManager.STORAGE_KEY];
      }
    } catch (error) {
      console.error('Failed to load analytics events:', error);
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      // Keep only the most recent events
      if (this.events.length > AnalyticsManager.MAX_EVENTS) {
        this.events = this.events.slice(-AnalyticsManager.MAX_EVENTS);
      }

      await chrome.storage.local.set({
        [AnalyticsManager.STORAGE_KEY]: this.events
      });
    } catch (error) {
      console.error('Failed to save analytics events:', error);
    }
  }

  private async startSession(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [AnalyticsManager.SESSION_KEY]: {
          sessionId: this.sessionId,
          startTime: this.sessionStartTime,
          lastActivity: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  public async trackEvent(
    type: AnalyticsEvent['type'],
    data: Record<string, any> = {}
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      data,
      sessionId: this.sessionId
    };

    this.events.push(event);
    await this.saveEvents();

    // Update session activity
    try {
      await chrome.storage.local.set({
        [AnalyticsManager.SESSION_KEY]: {
          sessionId: this.sessionId,
          startTime: this.sessionStartTime,
          lastActivity: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  public async trackReplyGenerated(
    tone: string,
    responseTime: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.trackEvent('reply_generated', {
      tone,
      responseTime,
      success,
      errorMessage
    });
  }

  public async trackReplyUsed(
    replyId: string,
    tone: string,
    method: 'copy' | 'auto_fill'
  ): Promise<void> {
    await this.trackEvent('reply_used', {
      replyId,
      tone,
      method
    });
  }

  public async trackTemplateCreated(templateId: string, tone: string): Promise<void> {
    await this.trackEvent('template_created', {
      templateId,
      tone
    });
  }

  public async trackTemplateUsed(templateId: string, tone: string): Promise<void> {
    await this.trackEvent('template_used', {
      templateId,
      tone
    });
  }

  public async trackAutomationTriggered(
    ruleId: string,
    ruleName: string,
    success: boolean
  ): Promise<void> {
    await this.trackEvent('automation_triggered', {
      ruleId,
      ruleName,
      success
    });
  }

  public async trackError(
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('error_occurred', {
      errorType,
      errorMessage,
      context
    });
  }

  public getPerformanceMetrics(timeRange?: {
    start: Date;
    end: Date;
  }): PerformanceMetrics {
    let filteredEvents = this.events;

    if (timeRange) {
      filteredEvents = this.events.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= timeRange.start && eventTime <= timeRange.end;
      });
    }

    const replyEvents = filteredEvents.filter(e => e.type === 'reply_generated');
    const templateEvents = filteredEvents.filter(e => e.type === 'template_used');
    const automationEvents = filteredEvents.filter(e => e.type === 'automation_triggered');

    // Calculate reply metrics
    const totalReplies = replyEvents.length;
    const successfulReplies = replyEvents.filter(e => e.data.success).length;
    const failedReplies = totalReplies - successfulReplies;
    const averageResponseTime = replyEvents.reduce((sum, e) => sum + (e.data.responseTime || 0), 0) / totalReplies || 0;

    // Calculate tone usage
    const toneUsage: Record<string, number> = {};
    replyEvents.forEach(event => {
      const tone = event.data.tone;
      toneUsage[tone] = (toneUsage[tone] || 0) + 1;
    });

    // Calculate template usage
    const templateUsageMap: Record<string, number> = {};
    templateEvents.forEach(event => {
      const templateId = event.data.templateId;
      templateUsageMap[templateId] = (templateUsageMap[templateId] || 0) + 1;
    });

    const topTemplates = Object.entries(templateUsageMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, name: `Template ${id}`, usageCount: count }));

    // Calculate automation stats
    const automationSuccessful = automationEvents.filter(e => e.data.success).length;
    const automationSuccessRate = automationEvents.length > 0 ? automationSuccessful / automationEvents.length : 0;

    const ruleUsageMap: Record<string, { name: string; triggers: number }> = {};
    automationEvents.forEach(event => {
      const ruleId = event.data.ruleId;
      const ruleName = event.data.ruleName;
      if (!ruleUsageMap[ruleId]) {
        ruleUsageMap[ruleId] = { name: ruleName, triggers: 0 };
      }
      ruleUsageMap[ruleId].triggers++;
    });

    const topRules = Object.entries(ruleUsageMap)
      .sort(([, a], [, b]) => b.triggers - a.triggers)
      .slice(0, 5)
      .map(([id, data]) => ({ id, name: data.name, triggers: data.triggers }));

    return {
      totalReplies,
      successfulReplies,
      failedReplies,
      averageResponseTime,
      apiUsage: {
        totalCalls: totalReplies,
        successfulCalls: successfulReplies,
        failedCalls: failedReplies,
        averageLatency: averageResponseTime
      },
      toneUsage,
      templateUsage: {
        totalUsed: templateEvents.length,
        topTemplates
      },
      automationStats: {
        triggeredReplies: automationEvents.length,
        successRate: automationSuccessRate,
        topRules
      }
    };
  }

  public getUserBehavior(timeRange?: {
    start: Date;
    end: Date;
  }): UserBehavior {
    let filteredEvents = this.events;

    if (timeRange) {
      filteredEvents = this.events.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= timeRange.start && eventTime <= timeRange.end;
      });
    }

    // Calculate session duration
    const sessions = new Set(filteredEvents.map(e => e.sessionId));
    const sessionDuration = sessions.size > 0 ? (Date.now() - this.sessionStartTime) / sessions.size : 0;

    // Calculate actions per session
    const actionsPerSession = sessions.size > 0 ? filteredEvents.length / sessions.size : 0;

    // Calculate feature usage
    const featureUsage: Record<string, number> = {};
    filteredEvents.forEach(event => {
      featureUsage[event.type] = (featureUsage[event.type] || 0) + 1;
    });

    const mostUsedFeatures = Object.entries(featureUsage)
      .sort(([, a], [, b]) => b - a)
      .map(([feature, usage]) => ({ feature, usage }));

    // Calculate time of day usage
    const timeOfDayUsage: Record<string, number> = {};
    filteredEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours().toString();
      timeOfDayUsage[hour] = (timeOfDayUsage[hour] || 0) + 1;
    });

    // Calculate day of week usage
    const dayOfWeekUsage: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    filteredEvents.forEach(event => {
      const dayName = dayNames[new Date(event.timestamp).getDay()];
      dayOfWeekUsage[dayName] = (dayOfWeekUsage[dayName] || 0) + 1;
    });

    return {
      sessionDuration,
      actionsPerSession,
      mostUsedFeatures,
      timeOfDayUsage,
      dayOfWeekUsage
    };
  }

  public async exportData(): Promise<{
    events: AnalyticsEvent[];
    metrics: PerformanceMetrics;
    behavior: UserBehavior;
  }> {
    return {
      events: [...this.events],
      metrics: this.getPerformanceMetrics(),
      behavior: this.getUserBehavior()
    };
  }

  public async clearData(): Promise<void> {
    this.events = [];
    await chrome.storage.local.remove([AnalyticsManager.STORAGE_KEY]);
  }
}
