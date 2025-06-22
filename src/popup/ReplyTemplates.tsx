import React, { useState, useEffect } from 'react';
import { ReplyTemplate, ReplyHistory } from '../utils/replyTemplates/types';
import { TemplateManager } from '../utils/replyTemplates/TemplateManager';

export default function ReplyTemplates() {
  const [templateManager] = useState(() => new TemplateManager());
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [history, setHistory] = useState<ReplyHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTone, setSelectedTone] = useState<ReplyTemplate['tone'] | ''>('');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    tone: 'Smart' as ReplyTemplate['tone'],
    tags: [] as string[],
    tagInput: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setTemplates(templateManager.getTemplates());
    setHistory(templateManager.getHistory());
  };

  const handleAddTemplate = async () => {
    if (newTemplate.name && newTemplate.content) {
      await templateManager.addTemplate({
        name: newTemplate.name,
        content: newTemplate.content,
        tone: newTemplate.tone,
        tags: newTemplate.tags,
        isFavorite: false
      });

      setNewTemplate({
        name: '',
        content: '',
        tone: 'Smart',
        tags: [],
        tagInput: ''
      });
      setShowNewTemplateForm(false);
      loadData();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await templateManager.deleteTemplate(id);
    loadData();
  };

  const handleToggleFavorite = async (id: string) => {
    await templateManager.toggleFavorite(id);
    loadData();
  };

  const handleUseTemplate = async (template: ReplyTemplate) => {
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(template.content);
      
      // Update usage count
      await templateManager.updateTemplate(template.id, {
        usageCount: template.usageCount + 1,
        lastUsed: new Date().toISOString()
      });
      
      loadData();
      
      // Show success message
      alert('Template copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy template:', error);
    }
  };

  const handleAddTag = () => {
    if (newTemplate.tagInput.trim() && !newTemplate.tags.includes(newTemplate.tagInput.trim())) {
      setNewTemplate({
        ...newTemplate,
        tags: [...newTemplate.tags, newTemplate.tagInput.trim()],
        tagInput: ''
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTemplate({
      ...newTemplate,
      tags: newTemplate.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const filteredTemplates = templateManager.searchTemplates(searchQuery, {
    tone: selectedTone || undefined,
    favorites: false
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reply Templates</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded ${
              activeTab === 'templates' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded ${
              activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as ReplyTemplate['tone'] | '')}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tones</option>
              <option value="Smart">Smart</option>
              <option value="Funny">Funny</option>
              <option value="Serious">Serious</option>
              <option value="Degen">Degen</option>
            </select>
            <button
              onClick={() => setShowNewTemplateForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Template
            </button>
          </div>

          {/* New Template Form */}
          {showNewTemplateForm && (
            <div className="p-4 border rounded-md space-y-4 bg-gray-50">
              <input
                type="text"
                placeholder="Template Name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Template Content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                value={newTemplate.tone}
                onChange={(e) => setNewTemplate({ ...newTemplate, tone: e.target.value as ReplyTemplate['tone'] })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Smart">Smart</option>
                <option value="Funny">Funny</option>
                <option value="Serious">Serious</option>
                <option value="Degen">Degen</option>
              </select>

              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add tag"
                    value={newTemplate.tagInput}
                    onChange={(e) => setNewTemplate({ ...newTemplate, tagInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {newTemplate.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddTemplate}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Template
                </button>
                <button
                  onClick={() => setShowNewTemplateForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Templates List */}
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <div key={template.id} className="p-3 border rounded-md hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{template.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        template.tone === 'Smart' ? 'bg-blue-100 text-blue-800' :
                        template.tone === 'Funny' ? 'bg-yellow-100 text-yellow-800' :
                        template.tone === 'Serious' ? 'bg-gray-100 text-gray-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {template.tone}
                      </span>
                      {template.isFavorite && <span className="text-yellow-500">⭐</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {template.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Used {template.usageCount} times
                      {template.lastUsed && ` • Last used ${new Date(template.lastUsed).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(template.id)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                    >
                      {template.isFavorite ? 'Unfav' : 'Fav'}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {history.map(entry => (
            <div key={entry.id} className="p-3 border rounded-md">
              <div className="text-sm text-gray-500 mb-1">
                {new Date(entry.timestamp).toLocaleString()} • {entry.tone}
              </div>
              <div className="text-sm mb-2">
                <strong>Original:</strong> {entry.originalTweet}
              </div>
              <div className="text-sm mb-2">
                <strong>Reply:</strong> {entry.generatedReply}
              </div>
              {entry.performance && (
                <div className="text-xs text-gray-500">
                  Performance: {entry.performance.likes} likes, {entry.performance.retweets} retweets, {entry.performance.replies} replies
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
