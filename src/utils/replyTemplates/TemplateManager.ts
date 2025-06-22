import { ReplyTemplate, ReplyHistory, TemplateCategory } from './types';

export class TemplateManager {
  private static readonly STORAGE_KEYS = {
    TEMPLATES: 'replyTemplates',
    HISTORY: 'replyHistory',
    CATEGORIES: 'templateCategories'
  };

  private templates: ReplyTemplate[] = [];
  private history: ReplyHistory[] = [];
  private categories: TemplateCategory[] = [];

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        TemplateManager.STORAGE_KEYS.TEMPLATES,
        TemplateManager.STORAGE_KEYS.HISTORY,
        TemplateManager.STORAGE_KEYS.CATEGORIES
      ]);

      this.templates = result[TemplateManager.STORAGE_KEYS.TEMPLATES] || [];
      this.history = result[TemplateManager.STORAGE_KEYS.HISTORY] || [];
      this.categories = result[TemplateManager.STORAGE_KEYS.CATEGORIES] || [];
    } catch (error) {
      console.error('Failed to load template data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [TemplateManager.STORAGE_KEYS.TEMPLATES]: this.templates,
        [TemplateManager.STORAGE_KEYS.HISTORY]: this.history,
        [TemplateManager.STORAGE_KEYS.CATEGORIES]: this.categories
      });
    } catch (error) {
      console.error('Failed to save template data:', error);
    }
  }

  // Template Management
  public async addTemplate(template: Omit<ReplyTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<ReplyTemplate> {
    const newTemplate: ReplyTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isFavorite: false
    };

    this.templates.push(newTemplate);
    await this.saveData();
    return newTemplate;
  }

  public async updateTemplate(id: string, updates: Partial<ReplyTemplate>): Promise<ReplyTemplate | null> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates
    };

    await this.saveData();
    return this.templates[index];
  }

  public async deleteTemplate(id: string): Promise<boolean> {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== id);
    
    if (this.templates.length !== initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  public async toggleFavorite(id: string): Promise<boolean> {
    const template = this.templates.find(t => t.id === id);
    if (!template) return false;

    template.isFavorite = !template.isFavorite;
    await this.saveData();
    return template.isFavorite;
  }

  // History Management
  public async addToHistory(entry: Omit<ReplyHistory, 'id' | 'timestamp'>): Promise<ReplyHistory> {
    const historyEntry: ReplyHistory = {
      ...entry,
      id: `history-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    this.history.unshift(historyEntry); // Add to beginning
    
    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    await this.saveData();
    return historyEntry;
  }

  public async updateHistoryPerformance(id: string, performance: ReplyHistory['performance']): Promise<boolean> {
    const entry = this.history.find(h => h.id === id);
    if (!entry) return false;

    entry.performance = performance;
    await this.saveData();
    return true;
  }

  public async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveData();
  }

  // Category Management
  public async addCategory(category: Omit<TemplateCategory, 'id'>): Promise<TemplateCategory> {
    const newCategory: TemplateCategory = {
      ...category,
      id: `category-${Date.now()}`
    };

    this.categories.push(newCategory);
    await this.saveData();
    return newCategory;
  }

  public async updateCategory(id: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory | null> {
    const category = this.categories.find(c => c.id === id);
    if (!category) return null;

    Object.assign(category, updates);
    await this.saveData();
    return category;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const initialLength = this.categories.length;
    this.categories = this.categories.filter(c => c.id !== id);
    
    if (this.categories.length !== initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  // Getters
  public getTemplates(): ReplyTemplate[] {
    return [...this.templates];
  }

  public getTemplate(id: string): ReplyTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }

  public getFavoriteTemplates(): ReplyTemplate[] {
    return this.templates.filter(t => t.isFavorite);
  }

  public getHistory(): ReplyHistory[] {
    return [...this.history];
  }

  public getCategories(): TemplateCategory[] {
    return [...this.categories];
  }

  public getCategory(id: string): TemplateCategory | null {
    return this.categories.find(c => c.id === id) || null;
  }

  // Search and Filter
  public searchTemplates(query: string, filters?: {
    tone?: ReplyTemplate['tone'];
    tags?: string[];
    favorites?: boolean;
  }): ReplyTemplate[] {
    return this.templates.filter(template => {
      // Search query
      if (query) {
        const searchText = `${template.name} ${template.content} ${template.tags.join(' ')}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) {
          return false;
        }
      }

      // Tone filter
      if (filters?.tone && template.tone !== filters.tone) {
        return false;
      }

      // Tags filter
      if (filters?.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tag => template.tags.includes(tag))) {
          return false;
        }
      }

      // Favorites filter
      if (filters?.favorites && !template.isFavorite) {
        return false;
      }

      return true;
    });
  }

  // Analytics
  public getTemplateAnalytics(): {
    totalTemplates: number;
    totalUsage: number;
    usageByTone: Record<ReplyTemplate['tone'], number>;
    topTemplates: Array<{ template: ReplyTemplate; usageCount: number }>;
  } {
    const usageByTone: Record<ReplyTemplate['tone'], number> = {
      Smart: 0,
      Funny: 0,
      Serious: 0,
      Degen: 0
    };

    let totalUsage = 0;

    this.templates.forEach(template => {
      usageByTone[template.tone] += template.usageCount;
      totalUsage += template.usageCount;
    });

    const topTemplates = [...this.templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(template => ({
        template,
        usageCount: template.usageCount
      }));

    return {
      totalTemplates: this.templates.length,
      totalUsage,
      usageByTone,
      topTemplates
    };
  }
}
