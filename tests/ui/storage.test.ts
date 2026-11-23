import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DEFAULT_CONSTITUTIONS } from '../../src/constitution/presets';
import {
  DEFAULT_SETTINGS, SETTINGS_KEY, MARKDOWN_KEY,
  loadPersistedSettings, savePersistedSettings, loadPersistedMarkdown, savePersistedMarkdown
} from '../../src/ui/storage';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); }
  };
}

const preferences = {
  aiProvider: 'groq' as const,
  aiModel: 'test-model',
  ollamaEndpoint: 'http://localhost:11434/v1'
};
const connection = {
  ...preferences, paypalClientId: 'fixture-id', paypalClientSecret: 'fixture-secret', aiApiKey: 'fixture-api-key'
};

describe('browser settings', () => {
  let local: ReturnType<typeof memoryStorage>;
  let session: ReturnType<typeof memoryStorage>;
  let cookies: Map<string, string>;

  beforeEach(() => {
    local = memoryStorage();
    session = memoryStorage();
    cookies = new Map();
    vi.stubGlobal('localStorage', local);
    vi.stubGlobal('sessionStorage', session);
    vi.stubGlobal('document', {
      get cookie() { return Array.from(cookies, ([key, value]) => key + '=' + value).join('; '); },
      set cookie(header: string) {
        const pair = header.split(';')[0];
        const split = pair.indexOf('=');
        const key = pair.slice(0, split);
        if (header.toLowerCase().includes('max-age=0')) cookies.delete(key);
        else cookies.set(key, pair.slice(split + 1));
      }
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts with the built-in local reasoner and empty credentials', () => {
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, aiProvider: 'local', paypalClientId: '', paypalClientSecret: '', aiApiKey: '' });
  });

  it('remembers only the allowed preferences in both stores', () => {
    savePersistedSettings(connection);
    for (const store of [local, session]) {
      expect(JSON.parse(store.getItem(SETTINGS_KEY)!)).toEqual(preferences);
    }
    expect(cookies.has(SETTINGS_KEY)).toBe(false);
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, ...preferences });
    expect(connection.aiApiKey).toBe('fixture-api-key');
  });

  it('scrubs every legacy copy even when local preferences take precedence', () => {
    local.setItem(SETTINGS_KEY, JSON.stringify({ ...connection, unknownToken: 'fixture-extra' }));
    session.setItem(SETTINGS_KEY, JSON.stringify({ ...connection, aiProvider: 'ollama' }));
    cookies.set(SETTINGS_KEY, encodeURIComponent(JSON.stringify(connection)));
    cookies.set('unrelated', 'keep');
    local.setItem('unrelated', 'keep');
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, ...preferences });
    expect(JSON.parse(local.getItem(SETTINGS_KEY)!)).toEqual(preferences);
    expect(JSON.parse(session.getItem(SETTINGS_KEY)!)).toEqual({ ...preferences, aiProvider: 'ollama' });
    expect(cookies).toEqual(new Map([['unrelated', 'keep']]));
    expect(local.getItem('unrelated')).toBe('keep');
  });

  it('migrates a cookie-only record before expiring it', () => {
    cookies.set(SETTINGS_KEY, encodeURIComponent(JSON.stringify(connection)));
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, ...preferences });
    expect(cookies.has(SETTINGS_KEY)).toBe(false);
    expect(JSON.parse(local.getItem(SETTINGS_KEY)!)).toEqual(preferences);
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, ...preferences });
  });

  it('drops unreadable records and still recovers from the other tier', () => {
    local.setItem(SETTINGS_KEY, '{broken-fixture');
    session.setItem(SETTINGS_KEY, JSON.stringify(connection));
    cookies.set(SETTINGS_KEY, '%malformed');
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, ...preferences });
    expect(local.getItem(SETTINGS_KEY)).toBeNull();
    expect(JSON.parse(session.getItem(SETTINGS_KEY)!)).toEqual(preferences);
    expect(cookies.has(SETTINGS_KEY)).toBe(false);
  });

  it('erases a stale record if overwriting it fails and another tier is available', () => {
    local.setItem(SETTINGS_KEY, JSON.stringify(connection));
    vi.spyOn(local, 'setItem').mockImplementation(() => { throw new Error('Storage quota'); });
    savePersistedSettings(connection);
    expect(local.getItem(SETTINGS_KEY)).toBeNull();
    expect(loadPersistedSettings()).toEqual({ ...DEFAULT_SETTINGS, ...preferences });
  });

  it('uses defaults when browser storage and cookies are unavailable', () => {
    const unavailable = { getItem() { throw new Error('Storage disabled'); } };
    vi.stubGlobal('localStorage', unavailable);
    vi.stubGlobal('sessionStorage', unavailable);
    vi.stubGlobal('document', undefined);
    expect(() => savePersistedSettings(connection)).not.toThrow();
    expect(loadPersistedSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it.each(['https://fixture:password@example.invalid/v1', 'https://example.invalid/v1?key=fixture'])(
    'keeps credentials embedded in an endpoint out of persistent storage',
    endpoint => {
      savePersistedSettings({ ...connection, ollamaEndpoint: endpoint });
      expect(JSON.parse(local.getItem(SETTINGS_KEY)!).ollamaEndpoint).toBe(DEFAULT_SETTINGS.ollamaEndpoint);
    }
  );

  it('keeps saved policy edits in web storage and erases a stale cookie', () => {
    const markdown = { ...DEFAULT_CONSTITUTIONS, PERSONAL: '# Personal test policy' };
    savePersistedMarkdown(markdown);
    expect(cookies.has(MARKDOWN_KEY)).toBe(false);
    cookies.set(MARKDOWN_KEY, encodeURIComponent(JSON.stringify(DEFAULT_CONSTITUTIONS)));
    expect(loadPersistedMarkdown()).toEqual(markdown);
    expect(cookies.has(MARKDOWN_KEY)).toBe(false);
  });

  it('moves a cookie-only policy into available web storage', () => {
    const markdown = { ...DEFAULT_CONSTITUTIONS, BUSINESS: '# Business test policy' };
    local.setItem(MARKDOWN_KEY, 'not-json');
    cookies.set(MARKDOWN_KEY, encodeURIComponent(JSON.stringify(markdown)));
    expect(loadPersistedMarkdown()).toEqual(markdown);
    expect(cookies.has(MARKDOWN_KEY)).toBe(false);
    expect(JSON.parse(session.getItem(MARKDOWN_KEY)!)).toEqual(markdown);
    expect(loadPersistedMarkdown()).toEqual(markdown);
  });

  it('expires a malformed policy cookie and keeps new edits off cookies even without web storage', () => {
    vi.stubGlobal('localStorage', undefined);
    vi.stubGlobal('sessionStorage', undefined);
    cookies.set(MARKDOWN_KEY, '%malformed');
    expect(loadPersistedMarkdown()).toEqual(DEFAULT_CONSTITUTIONS);
    savePersistedMarkdown({ ...DEFAULT_CONSTITUTIONS, BUSINESS: '# Temporary business rules' });
    expect(cookies.has(MARKDOWN_KEY)).toBe(false);
    expect(loadPersistedMarkdown()).toEqual(DEFAULT_CONSTITUTIONS);
  });
});
