import React, { useState, useEffect } from 'react'

function Settings() {
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

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fireworks AI API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="fw_..."
          className="w-full p-2 border rounded-lg text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Using Fireworks AI with Dobby Unhinged Llama model
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleSave}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
        
        <button
          onClick={testApiKey}
          disabled={testing}
          className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
        >
          {testing ? '⏳ Testing...' : '🧪 Test API Key'}
        </button>
        
        {testResult && (
          <div className={`text-sm p-2 rounded ${
            testResult.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {testResult}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Troubleshooting:</strong></p>
        <p>• Make sure your API key starts with "fw_"</p>
        <p>• If you get "Extension context invalidated", refresh the page</p>
        <p>• Check that you have credits in your Fireworks account</p>
      </div>
    </div>
  )
}

export default Settings