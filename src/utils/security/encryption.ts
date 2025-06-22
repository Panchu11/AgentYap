// Simple encryption utility for API keys
export class SecurityManager {
  private static readonly ENCRYPTION_KEY = 'yapmate-security-key';
  
  // Simple XOR encryption for basic obfuscation
  private static xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result); // Base64 encode
  }

  private static xorDecrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  public static async encryptApiKey(apiKey: string): Promise<string> {
    if (!apiKey) return '';
    
    // Add timestamp for additional security
    const timestamp = Date.now().toString();
    const dataToEncrypt = `${apiKey}|${timestamp}`;
    
    return this.xorEncrypt(dataToEncrypt, this.ENCRYPTION_KEY);
  }

  public static async decryptApiKey(encryptedKey: string): Promise<string> {
    if (!encryptedKey) return '';
    
    try {
      const decrypted = this.xorDecrypt(encryptedKey, this.ENCRYPTION_KEY);
      const [apiKey, timestamp] = decrypted.split('|');
      
      // Validate timestamp (optional - for additional security)
      const keyAge = Date.now() - parseInt(timestamp);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (keyAge > maxAge) {
        console.warn('API key is too old, may need re-authentication');
      }
      
      return apiKey || '';
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return '';
    }
  }

  public static async storeSecureApiKey(apiKey: string): Promise<boolean> {
    try {
      const encryptedKey = await this.encryptApiKey(apiKey);
      await chrome.storage.local.set({ 
        encryptedFireworksApiKey: encryptedKey,
        keyStoredAt: Date.now()
      });
      
      // Remove any old unencrypted keys
      await chrome.storage.sync.remove(['fireworksApiKey']);
      
      return true;
    } catch (error) {
      console.error('Failed to store encrypted API key:', error);
      return false;
    }
  }

  public static async getSecureApiKey(): Promise<string> {
    try {
      // First try to get encrypted key
      const result = await chrome.storage.local.get(['encryptedFireworksApiKey']);
      if (result.encryptedFireworksApiKey) {
        return await this.decryptApiKey(result.encryptedFireworksApiKey);
      }
      
      // Fallback to old unencrypted key and migrate
      const oldResult = await chrome.storage.sync.get(['fireworksApiKey']);
      if (oldResult.fireworksApiKey) {
        console.log('Migrating unencrypted API key to encrypted storage');
        await this.storeSecureApiKey(oldResult.fireworksApiKey);
        await chrome.storage.sync.remove(['fireworksApiKey']);
        return oldResult.fireworksApiKey;
      }
      
      return '';
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return '';
    }
  }

  public static async clearSecureApiKey(): Promise<void> {
    try {
      await chrome.storage.local.remove(['encryptedFireworksApiKey', 'keyStoredAt']);
      await chrome.storage.sync.remove(['fireworksApiKey']);
    } catch (error) {
      console.error('Failed to clear API key:', error);
    }
  }

  public static validateApiKey(apiKey: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!apiKey) {
      errors.push('API key is required');
    } else {
      if (apiKey.length < 10) {
        errors.push('API key is too short');
      }
      
      if (!apiKey.startsWith('fw_')) {
        errors.push('Invalid Fireworks API key format (should start with "fw_")');
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
        errors.push('API key contains invalid characters');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static async testApiKey(apiKey: string): Promise<{
    isWorking: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { isWorking: true };
      } else {
        return { 
          isWorking: false, 
          error: `API test failed: ${response.status} ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        isWorking: false, 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}
