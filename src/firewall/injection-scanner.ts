import type { InjectionScanResult, InjectionVectorType } from '../types/firewall';

interface VectorRule {
  vector: InjectionVectorType;
  patterns: RegExp[];
}

const HOMOGLYPH_MAP: Record<string, string> = {
  '\u0456': 'i',
  '\u0430': 'a',
  '\u0435': 'e',
  '\u043e': 'o',
  '\u0441': 'c',
  '\u0440': 'p',
  '\u0445': 'x',
  '\u0443': 'y'
};

function normalizeConfusables(input: string): string {
  return input.replace(/[\u0430-\u0456]/g, ch => HOMOGLYPH_MAP[ch] ?? ch);
}

const VECTOR_RULES: VectorRule[] = [
  {
    vector: 'ROLE_OVERRIDE',
    patterns: [
      /\[?\s*system\s+override[^\].]*/i,
      /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions[^\].]*/i,
      /disregard\s+(?:all\s+)?(?:previous|prior)\s+instructions[^\].]*/i,
      /<\s*admin_override[^>]*>/i
    ]
  },
  {
    vector: 'TOOL_SMUGGLING',
    patterns: [
      /(?:execute|call|run|invoke|trigger)\s+(?:pay_order|create_refund|accept_dispute_claim|record_payment_for_invoice|cancel_subscription)[^\].]*/i
    ]
  },
  {
    vector: 'AUTHORITY_COERCION',
    patterns: [
      /(?:ignore|bypass)\s+user\s+spend\s+caps?[^\].]*/i,
      /skip\s+(?:human\s+)?approval[^\].]*/i,
      /admin\s+policy\s+\d+[^\].]*/i,
      /executive\s+override[^\].]*/i
    ]
  }
];

export function scanForPromptInjection(untrustedText?: string): InjectionScanResult {
  if (!untrustedText || !untrustedText.trim()) {
    return {
      detected: false,
      vectors: [],
      flaggedQuotes: [],
      explanation:
        'No untrusted external text attached to this tool call (advisory scan).'
    };
  }

  const normalized = normalizeConfusables(untrustedText);
  const vectors = new Set<InjectionVectorType>();
  const flaggedQuotes: string[] = [];

  for (const rule of VECTOR_RULES) {
    for (const regex of rule.patterns) {
      const match = normalized.match(regex);
      if (match && match[0] && typeof match.index === 'number') {
        vectors.add(rule.vector);
        const originalSlice = untrustedText
          .slice(match.index, match.index + match[0].length)
          .trim();
        if (!flaggedQuotes.includes(originalSlice)) {
          flaggedQuotes.push(originalSlice);
        }
      }
    }
  }

  const detected = vectors.size > 0;
  const vectorList = Array.from(vectors);

  return {
    detected,
    vectors: vectorList,
    flaggedQuotes,
    explanation: detected
      ? `Detected indirect prompt injection (${vectorList.join(', ')}) inside untrusted external text.`
      : 'No configured injection patterns detected (advisory scan; authorization enforced by PAYPAL.md & Ledger).'
  };
}
