import React, { useState, useEffect } from 'react';
import { AnalyticsManager, PerformanceMetrics, UserBehavior } from '../utils/analytics/AnalyticsManager';

export default function Analytics() {
  const [analyticsManager] = useState(() => new AnalyticsManager());
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'performance' | 'behavior'>('performance');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = () => {
    const now = new Date();
    let start = new Date();

    switch (timeRange) {
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        start = new Date(0); // Beginning of time
        break;
    }

    setMetrics(analyticsManager.getPerformanceMetrics({ start, end: now }));
    setBehavior(analyticsManager.getUserBehavior({ start, end: now }));
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1 rounded ${
              activeTab === 'performance' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`px-3 py-1 rounded ${
              activeTab === 'behavior' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            User Behavior
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['day', 'week', 'month', 'all'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded ${
              timeRange === range ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && metrics && (
        <div className="space-y-6">
          {/* Reply Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Replies</div>
              <div className="text-2xl font-bold">{formatNumber(metrics.totalReplies)}</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-2xl font-bold">
                {formatNumber((metrics.successfulReplies / metrics.totalReplies) * 100)}%
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500">Avg Response Time</div>
              <div className="text-2xl font-bold">{formatNumber(metrics.averageResponseTime)}ms</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500">Templates Used</div>
              <div className="text-2xl font-bold">{formatNumber(metrics.templateUsage.totalUsed)}</div>
            </div>
          </div>

          {/* Tone Usage */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-3">Tone Distribution</h3>
            <div className="space-y-2">
              {Object.entries(metrics.toneUsage).map(([tone, count]) => (
                <div key={tone} className="flex items-center">
                  <div className="w-24 text-sm">{tone}</div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(count / metrics.totalReplies) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Templates */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-3">Top Templates</h3>
            <div className="space-y-2">
              {metrics.templateUsage.topTemplates.map(template => (
                <div key={template.id} className="flex items-center justify-between">
                  <div className="text-sm">{template.name}</div>
                  <div className="text-sm text-gray-500">Used {template.usageCount} times</div>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Performance */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-3">Automation Performance</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Triggered Replies</div>
                <div className="text-xl font-bold">{metrics.automationStats.triggeredReplies}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Success Rate</div>
                <div className="text-xl font-bold">
                  {formatNumber(metrics.automationStats.successRate * 100)}%
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {metrics.automationStats.topRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between">
                  <div className="text-sm">{rule.name}</div>
                  <div className="text-sm text-gray-500">{rule.triggers} triggers</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'behavior' && behavior && (
        <div className="space-y-6">
          {/* Session Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500">Avg Session Duration</div>
              <div className="text-2xl font-bold">{formatDuration(behavior.sessionDuration)}</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500">Actions per Session</div>
              <div className="text-2xl font-bold">{formatNumber(behavior.actionsPerSession)}</div>
            </div>
          </div>

          {/* Most Used Features */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-3">Most Used Features</h3>
            <div className="space-y-2">
              {behavior.mostUsedFeatures.map(({ feature, usage }) => (
                <div key={feature} className="flex items-center justify-between">
                  <div className="text-sm capitalize">{feature.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-gray-500">{usage} times</div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Patterns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Time of Day Usage */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-3">Time of Day Usage</h3>
              <div className="space-y-2">
                {Object.entries(behavior.timeOfDayUsage)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([hour, count]) => (
                    <div key={hour} className="flex items-center">
                      <div className="w-16 text-sm">
                        {hour.padStart(2, '0')}:00
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${(count / Math.max(...Object.values(behavior.timeOfDayUsage))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Day of Week Usage */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-3">Day of Week Usage</h3>
              <div className="space-y-2">
                {Object.entries(behavior.dayOfWeekUsage).map(([day, count]) => (
                  <div key={day} className="flex items-center">
                    <div className="w-24 text-sm">{day}</div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(count / Math.max(...Object.values(behavior.dayOfWeekUsage))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
