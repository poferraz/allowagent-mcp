import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  MARKDOWN_KEY,
  loadPersistedSettings,
  savePersistedSettings,
  loadPersistedMarkdown,
  savePersistedMarkdown,
  readStorageItem,
  writeStorageItem
} from '../../src/ui/storage';
import { DEFAULT_CONSTITUTIONS } from '../../src/constitution/presets';

describe('Storage Persistence Layer', () => {
  const memoryStore: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }

    const mockStorage = {
      getItem: vi.fn((key: string) => memoryStore[key] || null),
      setItem: vi.fn((key: string, val: string) => { memoryStore[key] = val; }),
      removeItem: vi.fn((key: string) => { delete memoryStore[key]; }),
      clear: vi.fn(() => { for (const k of Object.keys(memoryStore)) delete memoryStore[k]; })
    };

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('sessionStorage', mockStorage);
    vi.stubGlobal('document', { cookie: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads default settings when storage is empty', () => {
    const loaded = loadPersistedSettings();
    expect(loaded).toEqual(DEFAULT_SETTINGS);
    expect(loaded.paypalClientId).toBe('');
    expect(loaded.paypalClientSecret).toBe('');
    expect(loaded.aiProvider).toBe('ollama');
  });

  it('saves and reloads connection settings across simulated refresh', () => {
    const customSettings = {
      paypalClientId: 'AZ_TEST_CLIENT_ID_123',
      paypalClientSecret: 'SEC_TEST_SECRET_456',
      aiProvider: 'groq' as const,
      aiApiKey: 'gsk_test_api_key_789',
      aiModel: 'llama-3.3-70b-versatile',
      ollamaEndpoint: 'http://localhost:11434/v1'
    };

    savePersistedSettings(customSettings);
    expect(memoryStore[SETTINGS_KEY]).toBeDefined();

    const restored = loadPersistedSettings();
    expect(restored.paypalClientId).toBe('AZ_TEST_CLIENT_ID_123');
    expect(restored.paypalClientSecret).toBe('SEC_TEST_SECRET_456');
    expect(restored.aiProvider).toBe('groq');
    expect(restored.aiApiKey).toBe('gsk_test_api_key_789');
    expect(restored.aiModel).toBe('llama-3.3-70b-versatile');
  });

  it('safely recovers missing fields from partial saved settings', () => {
    // Simulated legacy or partial store
    memoryStore[SETTINGS_KEY] = JSON.stringify({
      paypalClientId: 'AZ_PARTIAL_ID'
    });

    const restored = loadPersistedSettings();
    expect(restored.paypalClientId).toBe('AZ_PARTIAL_ID');
    expect(restored.paypalClientSecret).toBe('');
    expect(restored.aiProvider).toBe('ollama');
    expect(restored.aiModel).toBe('mistral-large-4:cloud');
  });

  it('falls back to sessionStorage if localStorage throws an error', () => {
    const sessionStore: Record<string, string> = {};
    const brokenLocalStorage = {
      getItem: () => { throw new Error('SecurityError: LocalStorage is disabled'); },
      setItem: () => { throw new Error('SecurityError: LocalStorage is disabled'); }
    };
    const workingSessionStorage = {
      getItem: (k: string) => sessionStore[k] || null,
      setItem: (k: string, v: string) => { sessionStore[k] = v; }
    };

    vi.stubGlobal('localStorage', brokenLocalStorage);
    vi.stubGlobal('sessionStorage', workingSessionStorage);

    writeStorageItem('test_key', 'persisted_in_session');
    expect(readStorageItem('test_key')).toBe('persisted_in_session');
  });

  it('persists and restores constitution markdown changes across simulated refresh', () => {
    const customMarkdown = {
      PERSONAL: '# Custom Personal Policy\nMAX_AUTO_PAY_USD = 50.00',
      BUSINESS: DEFAULT_CONSTITUTIONS.BUSINESS
    };

    savePersistedMarkdown(customMarkdown);
    expect(memoryStore[MARKDOWN_KEY]).toBeDefined();

    const restored = loadPersistedMarkdown();
    expect(restored.PERSONAL).toContain('MAX_AUTO_PAY_USD = 50.00');
    expect(restored.BUSINESS).toBe(DEFAULT_CONSTITUTIONS.BUSINESS);
  });
});
