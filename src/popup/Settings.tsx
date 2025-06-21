import React, { useState, useEffect } from 'react'

function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load saved API key
    chrome.storage.sync.get(['openrouterApiKey']).then((result) => {
      if (result.openrouterApiKey) {
        setApiKey(result.openrouterApiKey)
      }
    })
  }, [])

  const handleSave = async () => {
    await chrome.storage.sync.set({ openrouterApiKey: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenRouter API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          className="w-full p-2 border rounded-lg text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Get your free API key from <a href="https://openrouter.ai" target="_blank" className="text-blue-500">openrouter.ai</a>
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
      >
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}

export default Settings