import React from 'react'
import { Tone } from './App'

interface ToneSelectorProps {
  selectedTone: Tone
  onToneChange: (tone: Tone) => void
}

const tones: { value: Tone; label: string; emoji: string; description: string }[] = [
  { value: 'Smart', label: 'Smart', emoji: '🧠', description: 'Analytical & insightful' },
  { value: 'Funny', label: 'Funny', emoji: '😂', description: 'Witty & entertaining' },
  { value: 'Serious', label: 'Serious', emoji: '💼', description: 'Professional & direct' },
  { value: 'Degen', label: 'Degen', emoji: '🚀', description: 'Bold & crypto-native' }
]

function ToneSelector({ selectedTone, onToneChange }: ToneSelectorProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Reply Tone</h3>
      <div className="grid grid-cols-2 gap-2">
        {tones.map((tone) => (
          <button
            key={tone.value}
            onClick={() => onToneChange(tone.value)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedTone === tone.value
                ? 'border-twitter-blue bg-blue-50 text-twitter-blue'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{tone.emoji}</span>
              <span className="font-medium text-sm">{tone.label}</span>
            </div>
            <p className="text-xs opacity-75">{tone.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ToneSelector