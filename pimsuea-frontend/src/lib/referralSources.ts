import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  HelpCircle,
  Instagram,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';

export const REFERRAL_SOURCE_AI = 'ai_assistant' as const;

export type ReferralSourceValue =
  | typeof REFERRAL_SOURCE_AI
  | 'instagram'
  | 'tiktok'
  | 'search'
  | 'word_of_mouth'
  | 'other';

export type AiAssistantTool =
  | 'chatgpt'
  | 'gemini'
  | 'claude'
  | 'perplexity'
  | 'other';

export const REFERRAL_SOURCES: {
  value: ReferralSourceValue;
  label: string;
  icon: LucideIcon | string;
  emoji?: string;
}[] = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'tiktok', label: 'TikTok', icon: Sparkles },
  { value: 'search', label: 'ค้นหาออนไลน์', icon: Search },
  {
    value: REFERRAL_SOURCE_AI,
    label: 'AI assistant (ChatGPT, Gemini, Claude, Perplexity)',
    icon: Bot,
  },
  { value: 'word_of_mouth', label: 'เพื่อนแนะนำ', icon: Users },
  { value: 'other', label: 'อื่น ๆ', icon: HelpCircle },
];

/** Emoji icons for onboarding grid (Settings uses Lucide). */
export const REFERRAL_SOURCES_ONBOARDING = [
  { value: 'instagram', label: 'Instagram', icon: '📱' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'search', label: 'ค้นหาออนไลน์', icon: '🔍' },
  {
    value: REFERRAL_SOURCE_AI,
    label: 'AI assistant',
    icon: '🤖',
  },
  { value: 'word_of_mouth', label: 'เพื่อนแนะนำ', icon: '🗣️' },
  { value: 'other', label: 'อื่น ๆ', icon: '✨' },
] as const;

export const AI_ASSISTANT_TOOLS: { value: AiAssistantTool; label: string }[] = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'other', label: 'อื่น ๆ' },
];

export function isAiAssistantSource(source: string | null | undefined): boolean {
  return source === REFERRAL_SOURCE_AI;
}
