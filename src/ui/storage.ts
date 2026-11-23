import type { ConnectionSettings } from './components/ConnectionModal';
import type { ConstitutionMode } from '../types/constitution';
import { DEFAULT_CONSTITUTIONS } from '../constitution/presets';
import { normalizeOllamaEndpoint } from '../agent/ollama-endpoint';

export const SETTINGS_KEY = 'allowagent_connection_settings';
export const MARKDOWN_KEY = 'allowagent_markdown_by_mode';

export const DEFAULT_SETTINGS: ConnectionSettings = {
  paypalClientId: '',
  paypalClientSecret: '',
  aiProvider: 'local',
  aiApiKey: '',
  aiModel: 'mistral-large-4:cloud',
  ollamaEndpoint: 'http://localhost:11434/v1'
};

const storeNames = ['localStorage', 'sessionStorage'] as const;
type Preferences = Pick<ConnectionSettings, 'aiProvider' | 'aiModel' | 'ollamaEndpoint'>;

function getStorage(name: typeof storeNames[number]): Storage | undefined {
  try { return globalThis[name]; } catch { return undefined; }
}

function takeLegacyCookie(key: string): string | undefined {
  try {
    const pair = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(key + '='));
    if (!pair) return undefined;
    // Erase the root-path cookie even if its contents can no longer be decoded.
    document.cookie = key + '=; Path=/; Max-Age=0; SameSite=Lax';
    return decodeURIComponent(pair.slice(key.length + 1));
  } catch { return undefined; }
}

function preferencesFrom(value: unknown): Preferences | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const settings = value as Partial<ConnectionSettings>;
  const providers = ['local', 'ollama', 'groq', 'gemini', 'openai'] as const;
  return {
    aiProvider: providers.find(provider => provider === settings.aiProvider) ?? DEFAULT_SETTINGS.aiProvider,
    aiModel: typeof settings.aiModel === 'string' ? settings.aiModel : DEFAULT_SETTINGS.aiModel,
    ollamaEndpoint: (typeof settings.ollamaEndpoint === 'string' && normalizeOllamaEndpoint(settings.ollamaEndpoint)) || DEFAULT_SETTINGS.ollamaEndpoint
  };
}

function removeSettings(store: Storage): void {
  try { store.removeItem(SETTINGS_KEY); } catch {}
}

function storePreferences(store: Storage, preferences: Preferences): void {
  try { store.setItem(SETTINGS_KEY, JSON.stringify(preferences)); }
  catch { removeSettings(store); } // A full store may still allow an earlier record to be erased.
}

export function loadPersistedSettings(): ConnectionSettings {
  let preferences: Preferences | undefined;
  for (const name of storeNames) {
    const store = getStorage(name);
    if (!store) continue;
    try {
      const raw = store.getItem(SETTINGS_KEY);
      if (raw === null) continue;
      const safe = preferencesFrom(JSON.parse(raw));
      if (safe) {
        preferences ??= safe;
        if (raw !== JSON.stringify(safe)) storePreferences(store, safe);
        continue;
      }
    } catch {}
    removeSettings(store);
  }

  const cookie = takeLegacyCookie(SETTINGS_KEY);
  if (!preferences && cookie !== undefined) {
    try { preferences = preferencesFrom(JSON.parse(cookie)); } catch {}
    if (preferences) savePreferences(preferences);
  }
  return { ...DEFAULT_SETTINGS, ...preferences };
}

function savePreferences(preferences: Preferences): void {
  for (const name of storeNames) {
    const store = getStorage(name);
    if (store) storePreferences(store, preferences);
  }
}

export function savePersistedSettings(settings: ConnectionSettings): void {
  const preferences = preferencesFrom(settings);
  if (preferences) savePreferences(preferences);
}

function parseMarkdown(raw: string | null | undefined): Record<ConstitutionMode, string> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.PERSONAL !== 'string' && typeof parsed?.BUSINESS !== 'string') return undefined;
    return {
      PERSONAL: typeof parsed.PERSONAL === 'string' ? parsed.PERSONAL : DEFAULT_CONSTITUTIONS.PERSONAL,
      BUSINESS: typeof parsed.BUSINESS === 'string' ? parsed.BUSINESS : DEFAULT_CONSTITUTIONS.BUSINESS
    };
  } catch { return undefined; }
}

export function loadPersistedMarkdown(): Record<ConstitutionMode, string> {
  const cookie = takeLegacyCookie(MARKDOWN_KEY);
  for (const name of storeNames) {
    try {
      const markdown = parseMarkdown(getStorage(name)?.getItem(MARKDOWN_KEY));
      if (markdown) return markdown;
    } catch {}
  }
  const legacy = parseMarkdown(cookie);
  if (legacy) {
    savePersistedMarkdown(legacy);
    return legacy;
  }
  return { ...DEFAULT_CONSTITUTIONS };
}

export function savePersistedMarkdown(markdownByMode: Record<ConstitutionMode, string>): void {
  const value = JSON.stringify(markdownByMode);
  for (const name of storeNames) {
    try { getStorage(name)?.setItem(MARKDOWN_KEY, value); } catch {}
  }
}
