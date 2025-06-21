import React, { useState, useEffect } from 'react'

interface SettingsProps {
  onApiKeyUpdated: () => void
  theme: 'light' | 'dark'
}

function Settings({ onApiKeyUpdated, theme }: SettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    // Load saved API key
    chrome.storage.sync.get(['fireworksApiKey']).then((result) => {
      if (result.fireworksApiKey) {
        setApiKey(result.fireworksApiKey)
      }
    })
  }, [])

  const handleSave = async () => {
    await chrome.storage.sync.set({ fireworksApiKey: apiKey })
    setSaved(true)
    onApiKeyUpdated()
    setTimeout(() => setSaved(false), 2000)
  }

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult('Please enter an API key first')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
          messages: [
            {
              role: 'user',
              content: 'Test message'
            }
          ],
          max_tokens: 10
        })
      })

      if (response.ok) {
        setTestResult('✅ API key is valid!')
      } else if (response.status === 401) {
        setTestResult('❌ Invalid API key')
      } else {
        setTestResult(`❌ Error: ${response.status}`)
      }
    } catch (error) {
      setTestResult('❌ Network error')
    } finally {
      setTesting(false)
    }
  }

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
  const inputBg = theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* API Key Section */}
      <div className={`${cardBg} rounded-xl p-6 border shadow-sm`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center space-x-2`}>
          <span>🔑</span>
          <span>API Configuration</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
              Fireworks AI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fw_..."
              className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputBg}`}
            />
            <p className={`text-xs ${textSecondary} mt-2`}>
              Get your API key from{' '}
              <a 
                href="https://fireworks.ai" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:text-blue-600 underline"
              >
                fireworks.ai
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
              }`}
            >
              {saved ? '✅ Saved!' : 'Save Settings'}
            </button>
            
            <button
              onClick={testApiKey}
              disabled={testing}
              className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {testing ? '⏳ Testing...' : '🧪 Test API Key'}
            </button>
          </div>
          
          {testResult && (
            <div className={`text-sm p-3 rounded-lg ${
              testResult.includes('✅') 
                ? theme === 'dark' ? 'bg-green-900 bg-opacity-30 text-green-300' : 'bg-green-100 text-green-700'
                : theme === 'dark' ? 'bg-red-900 bg-opacity-30 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* How to Use Section */}
      <div className={`${cardBg} rounded-xl p-6 border shadow-sm`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center space-x-2`}>
          <span>📚</span>
          <span>How to use YapMate</span>
        </h3>
        <ol className={`text-sm ${textSecondary} space-y-2 list-decimal list-inside`}>
          <li>Navigate to X.com or Twitter.com</li>
          <li>Open YapMate sidebar (click extension icon)</li>
          <li>Toggle Crypto/General mode based on your needs</li>
          <li>View tweets from the current page</li>
          <li>Select tone and generate AI replies</li>
          <li>Copy replies or fill them directly into Twitter</li>
        </ol>
      </div>

      {/* Features Section */}
      <div className={`${cardBg} rounded-xl p-6 border shadow-sm`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center space-x-2`}>
          <span>✨</span>
          <span>Features</span>
        </h3>
        <div className={`text-sm ${textSecondary} space-y-2`}>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>Smart project detection (Bitcoin, Ethereum, Solana, etc.)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>Automatic hashtags, mentions, and tickers</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>4 different reply tones (Smart, Funny, Serious, Degen)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>Crypto/General mode toggle</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>One-click copy and rewrite</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>Direct reply box filling</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">•</span>
            <span>Dark/Light theme support</span>
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className={`${cardBg} rounded-xl p-6 border shadow-sm`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center space-x-2`}>
          <span>🔧</span>
          <span>Troubleshooting</span>
        </h3>
        <div className={`text-sm ${textSecondary} space-y-2`}>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span>Make sure your API key starts with "fw_"</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span>Refresh the page if tweets don't load</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span>Check that you have credits in your Fireworks account</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-500 mt-0.5">•</span>
            <span>Use Crypto mode for crypto-related tweets, General mode for others</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings