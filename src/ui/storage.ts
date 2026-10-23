import type { ConnectionSettings } from './components/ConnectionModal';
import type { ConstitutionMode } from '../types/constitution';
import { DEFAULT_CONSTITUTIONS } from '../constitution/presets';

export const SETTINGS_KEY = 'allowagent_connection_settings';
export const MARKDOWN_KEY = 'allowagent_markdown_by_mode';

export const DEFAULT_SETTINGS: ConnectionSettings = {
  paypalClientId: '',
  paypalClientSecret: '',
  aiProvider: 'ollama',
  aiApiKey: '',
  aiModel: 'mistral-large-4:cloud',
  ollamaEndpoint: 'http://localhost:11434/v1'
};

function getStorage(type: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    if (typeof window !== 'undefined' && window[type]) return window[type];
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[type]) {
      return (globalThis as Record<string, unknown>)[type] as Storage;
    }
  } catch {}
  return null;
}

export function readStorageItem(key: string): string | null {
  try {
    const local = getStorage('localStorage');
    if (local) {
      try {
        const val = local.getItem(key);
        if (val) return val;
      } catch {}
    }
    const session = getStorage('sessionStorage');
    if (session) {
      try {
        const val = session.getItem(key);
        if (val) return val;
      } catch {}
    }
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
      if (match) return decodeURIComponent(match[1]);
    }
  } catch {}
  return null;
}

export function writeStorageItem(key: string, value: string): void {
  try {
    const local = getStorage('localStorage');
    if (local) {
      try { local.setItem(key, value); } catch {}
    }
    const session = getStorage('sessionStorage');
    if (session) {
      try { session.setItem(key, value); } catch {}
    }
    // Never persist sensitive connection settings or credentials into document.cookie
    if (key !== SETTINGS_KEY && typeof document !== 'undefined') {
      try {
        document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${30 * 86400};SameSite=Lax;Secure`;
      } catch {}
    }
  } catch {}
}

export function loadPersistedSettings(): ConnectionSettings {
  const raw = readStorageItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return {
      paypalClientId: typeof parsed.paypalClientId === 'string' ? parsed.paypalClientId : DEFAULT_SETTINGS.paypalClientId,
      paypalClientSecret: typeof parsed.paypalClientSecret === 'string' ? parsed.paypalClientSecret : DEFAULT_SETTINGS.paypalClientSecret,
      aiProvider: parsed.aiProvider ?? DEFAULT_SETTINGS.aiProvider,
      aiApiKey: typeof parsed.aiApiKey === 'string' ? parsed.aiApiKey : DEFAULT_SETTINGS.aiApiKey,
      aiModel: typeof parsed.aiModel === 'string' ? parsed.aiModel : DEFAULT_SETTINGS.aiModel,
      ollamaEndpoint: typeof parsed.ollamaEndpoint === 'string' ? parsed.ollamaEndpoint : DEFAULT_SETTINGS.ollamaEndpoint
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function savePersistedSettings(settings: ConnectionSettings): void {
  writeStorageItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadPersistedMarkdown(): Record<ConstitutionMode, string> {
  const raw = readStorageItem(MARKDOWN_KEY);
  if (!raw) return { ...DEFAULT_CONSTITUTIONS };
  try {
    const parsed = JSON.parse(raw);
    return {
      PERSONAL: typeof parsed.PERSONAL === 'string' ? parsed.PERSONAL : DEFAULT_CONSTITUTIONS.PERSONAL,
      BUSINESS: typeof parsed.BUSINESS === 'string' ? parsed.BUSINESS : DEFAULT_CONSTITUTIONS.BUSINESS
    };
  } catch {
    return { ...DEFAULT_CONSTITUTIONS };
  }
}

export function savePersistedMarkdown(markdownByMode: Record<ConstitutionMode, string>): void {
  writeStorageItem(MARKDOWN_KEY, JSON.stringify(markdownByMode));
}
