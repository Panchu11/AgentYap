import React, { useState, useEffect } from 'react';
import { AutomatedEngagementConfig, EngagementRule, EngagementStats } from '../utils/automatedEngagement/types';
import { EngagementManager } from '../utils/automatedEngagement/EngagementManager';

const defaultConfig: AutomatedEngagementConfig = {
  enabled: false,
  maxDailyReplies: 50,
  rules: [],
  blacklistedWords: [],
  blacklistedHandles: [],
  operatingHours: {
    start: 9, // 9 AM
    end: 21, // 9 PM
  },
};

export default function AutomatedEngagement() {
  const [config, setConfig] = useState<AutomatedEngagementConfig>(defaultConfig);
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [newRule, setNewRule] = useState<Partial<EngagementRule>>({});
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  useEffect(() => {
    loadConfig();
    const interval = setInterval(loadStats, 60000); // Update stats every minute
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      const result = await chrome.storage.local.get(['automatedEngagementConfig']);
      if (result.automatedEngagementConfig) {
        setConfig(result.automatedEngagementConfig);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const manager = new EngagementManager(config);
      setStats(manager.getStats());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const saveConfig = async (newConfig: AutomatedEngagementConfig) => {
    try {
      await chrome.storage.local.set({ automatedEngagementConfig: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleToggleEnabled = () => {
    saveConfig({ ...config, enabled: !config.enabled });
  };

  const handleMaxDailyRepliesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      saveConfig({ ...config, maxDailyReplies: value });
    }
  };

  const handleOperatingHoursChange = (type: 'start' | 'end', value: string) => {
    const hour = parseInt(value);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      saveConfig({
        ...config,
        operatingHours: {
          ...config.operatingHours,
          [type]: hour
        }
      });
    }
  };

  const handleAddRule = () => {
    if (newRule.name && newRule.tonePreference) {
      const rule: EngagementRule = {
        id: `rule-${Date.now()}`,
        name: newRule.name,
        keywords: newRule.keywords || [],
        hashtags: newRule.hashtags || [],
        handles: newRule.handles || [],
        minEngagement: newRule.minEngagement || { likes: 0, retweets: 0 },
        tonePreference: newRule.tonePreference,
        responseDelay: newRule.responseDelay || { min: 60000, max: 300000 },
        enabled: true
      };

      saveConfig({
        ...config,
        rules: [...config.rules, rule]
      });

      setNewRule({});
      setShowNewRuleForm(false);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    saveConfig({
      ...config,
      rules: config.rules.filter(r => r.id !== ruleId)
    });
  };

  const handleToggleRule = (ruleId: string) => {
    saveConfig({
      ...config,
      rules: config.rules.map(r => 
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Automated Engagement</h2>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.enabled}
            onChange={handleToggleEnabled}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Daily Replies
          </label>
          <input
            type="number"
            min="0"
            value={config.maxDailyReplies}
            onChange={handleMaxDailyRepliesChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Operating Hours
          </label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500">Start</label>
              <input
                type="number"
                min="0"
                max="23"
                value={config.operatingHours.start}
                onChange={(e) => handleOperatingHoursChange('start', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">End</label>
              <input
                type="number"
                min="0"
                max="23"
                value={config.operatingHours.end}
                onChange={(e) => handleOperatingHoursChange('end', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Engagement Rules
            </label>
            <button
              onClick={() => setShowNewRuleForm(true)}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Rule
            </button>
          </div>

          {showNewRuleForm && (
            <div className="p-4 border rounded-md mb-4 space-y-4">
              <input
                type="text"
                placeholder="Rule Name"
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <select
                value={newRule.tonePreference || ''}
                onChange={(e) => setNewRule({ ...newRule, tonePreference: e.target.value as any })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select Tone</option>
                <option value="Smart">Smart</option>
                <option value="Funny">Funny</option>
                <option value="Serious">Serious</option>
                <option value="Degen">Degen</option>
              </select>

              <div className="flex gap-4">
                <button
                  onClick={handleAddRule}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Rule
                </button>
                <button
                  onClick={() => setShowNewRuleForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {config.rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{rule.name}</span>
                  <span className="ml-2 text-sm text-gray-500">({rule.tonePreference})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-2 py-1 text-sm rounded ${
                      rule.enabled ? 'bg-green-500' : 'bg-gray-500'
                    } text-white`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {stats && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Daily Replies</div>
                <div className="text-xl font-bold">{stats.dailyReplies}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Success Rate</div>
                <div className="text-xl font-bold">
                  {Math.round(
                    (stats.successfulReplies /
                      (stats.successfulReplies + stats.failedReplies || 1)) *
                      100
                  )}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
