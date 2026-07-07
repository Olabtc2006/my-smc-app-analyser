/**
 * Centralized theme styling system for the Elite SMC platform.
 * Supports configurable color sets, light/dark modes, and cybernetic themes.
 */

export interface ThemeObject {
  id: string;
  name: string;
  isDark: boolean;
  
  // Outer Shell styles
  bg: string;
  headerBg: string;
  border: string;
  divider: string;
  
  // Card elements
  cardBg: string;
  cardInnerBg: string;
  cardBorder: string;
  
  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Brand/Accent Color tokens (used in gauges, buttons, icons)
  accentColor: string;       // e.g., 'sky' | 'emerald' | 'amber' | 'cyan'
  accentBg: string;          // e.g., 'bg-sky-500'
  accentText: string;        // e.g., 'text-sky-400'
  accentBorder: string;      // e.g., 'border-sky-500/20'
  accentHoverBg: string;     // e.g., 'hover:bg-sky-400'
  accentRipples: string;     // e.g., 'shadow-sky-500/10'
  
  // Form input styles
  inputBg: string;
  inputBorder: string;
  inputText: string;
  
  // Glow effect class
  glowAccent: string;
}

export type ThemeId = 'midnight' | 'cyberpunk' | 'imperial' | 'titanium' | 'royal' | 'nordic' | 'crimson';

export const THEMES: Record<ThemeId, ThemeObject> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Sky (Dark)',
    isDark: true,
    bg: 'bg-slate-950',
    headerBg: 'bg-slate-950/90 border-slate-900',
    border: 'border-slate-900',
    divider: 'border-white/5',
    cardBg: 'bg-slate-900/70 border-slate-800',
    cardInnerBg: 'bg-slate-950/40 border-white/5',
    cardBorder: 'border-slate-800/80',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    textInverse: 'text-slate-950',
    accentColor: 'sky',
    accentBg: 'bg-sky-500',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/20',
    accentHoverBg: 'bg-sky-400 hover:bg-sky-300',
    accentRipples: 'shadow-sky-500/10',
    inputBg: 'bg-slate-950/60',
    inputBorder: 'border-slate-800 focus:border-sky-500/50 focus:ring-sky-500/20',
    inputText: 'text-slate-100',
    glowAccent: 'shadow-xl shadow-sky-500/5'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Matrix (Neon)',
    isDark: true,
    bg: 'bg-black',
    headerBg: 'bg-black/90 border-emerald-950',
    border: 'border-emerald-950',
    divider: 'border-emerald-500/10',
    cardBg: 'bg-stone-950/90 border-emerald-950/80',
    cardInnerBg: 'bg-emerald-950/10 border-emerald-500/10',
    cardBorder: 'border-emerald-500/15',
    textPrimary: 'text-emerald-50',
    textSecondary: 'text-emerald-200/80',
    textMuted: 'text-emerald-500/70',
    textInverse: 'text-black',
    accentColor: 'emerald',
    accentBg: 'bg-emerald-500',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/20',
    accentHoverBg: 'bg-emerald-400 hover:bg-emerald-300',
    accentRipples: 'shadow-emerald-500/15',
    inputBg: 'bg-black/80',
    inputBorder: 'border-emerald-950 focus:border-emerald-500/50 focus:ring-emerald-500/20',
    inputText: 'text-emerald-400 font-mono',
    glowAccent: 'shadow-lg shadow-emerald-500/5 border border-emerald-500/20'
  },
  imperial: {
    id: 'imperial',
    name: 'Imperial Gold (Premium)',
    isDark: true,
    bg: 'bg-zinc-950',
    headerBg: 'bg-zinc-950/90 border-zinc-900',
    border: 'border-zinc-800',
    divider: 'border-amber-500/10',
    cardBg: 'bg-zinc-900/80 border-zinc-800',
    cardInnerBg: 'bg-zinc-950/40 border-amber-500/5',
    cardBorder: 'border-zinc-800/80',
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-300',
    textMuted: 'text-zinc-400',
    textInverse: 'text-zinc-950',
    accentColor: 'amber',
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/20',
    accentHoverBg: 'bg-amber-400 hover:bg-amber-300',
    accentRipples: 'shadow-amber-500/10',
    inputBg: 'bg-zinc-950/60',
    inputBorder: 'border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20',
    inputText: 'text-zinc-100',
    glowAccent: 'shadow-xl shadow-amber-500/5'
  },
  royal: {
    id: 'royal',
    name: 'Amethyst Velvet (Purple)',
    isDark: true,
    bg: 'bg-neutral-950',
    headerBg: 'bg-neutral-950/90 border-violet-950/80',
    border: 'border-violet-950/60',
    divider: 'border-violet-500/10',
    cardBg: 'bg-neutral-900/80 border-violet-950/70',
    cardInnerBg: 'bg-violet-950/10 border-violet-500/10',
    cardBorder: 'border-violet-500/15',
    textPrimary: 'text-violet-50',
    textSecondary: 'text-violet-200/80',
    textMuted: 'text-violet-400/70',
    textInverse: 'text-black',
    accentColor: 'violet',
    accentBg: 'bg-violet-600',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/20',
    accentHoverBg: 'bg-violet-500 hover:bg-violet-400',
    accentRipples: 'shadow-violet-500/15',
    inputBg: 'bg-neutral-950/80',
    inputBorder: 'border-violet-950 focus:border-violet-500/50 focus:ring-violet-500/20',
    inputText: 'text-violet-100',
    glowAccent: 'shadow-lg shadow-violet-500/5 border border-violet-500/20'
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Frost (Cyan)',
    isDark: true,
    bg: 'bg-slate-950',
    headerBg: 'bg-slate-950/90 border-slate-900',
    border: 'border-cyan-950/60',
    divider: 'border-cyan-500/10',
    cardBg: 'bg-slate-900/80 border-cyan-950/70',
    cardInnerBg: 'bg-cyan-950/10 border-cyan-500/10',
    cardBorder: 'border-cyan-500/15',
    textPrimary: 'text-cyan-50',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    textInverse: 'text-black',
    accentColor: 'cyan',
    accentBg: 'bg-cyan-500',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/20',
    accentHoverBg: 'bg-cyan-400 hover:bg-cyan-300',
    accentRipples: 'shadow-cyan-500/15',
    inputBg: 'bg-slate-950/80',
    inputBorder: 'border-cyan-950 focus:border-cyan-500/50 focus:ring-cyan-500/20',
    inputText: 'text-cyan-100',
    glowAccent: 'shadow-lg shadow-cyan-500/5 border border-cyan-500/20'
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Rogue (Red)',
    isDark: true,
    bg: 'bg-stone-950',
    headerBg: 'bg-stone-950/90 border-stone-900',
    border: 'border-rose-950/60',
    divider: 'border-rose-500/10',
    cardBg: 'bg-stone-900/80 border-rose-950/70',
    cardInnerBg: 'bg-rose-950/10 border-rose-500/10',
    cardBorder: 'border-rose-500/15',
    textPrimary: 'text-rose-50',
    textSecondary: 'text-stone-300',
    textMuted: 'text-stone-450',
    textInverse: 'text-white',
    accentColor: 'rose',
    accentBg: 'bg-rose-600',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/20',
    accentHoverBg: 'bg-rose-500 hover:bg-rose-400',
    accentRipples: 'shadow-rose-500/15',
    inputBg: 'bg-stone-950/80',
    inputBorder: 'border-rose-950 focus:border-rose-500/50 focus:ring-rose-500/20',
    inputText: 'text-rose-100',
    glowAccent: 'shadow-lg shadow-rose-500/5 border border-rose-500/20'
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Light (Clean)',
    isDark: false,
    bg: 'bg-slate-50',
    headerBg: 'bg-white/95 border-slate-200/80 shadow-xs',
    border: 'border-slate-200',
    divider: 'border-slate-100',
    cardBg: 'bg-white border-slate-200 shadow-sm',
    cardInnerBg: 'bg-slate-50/80 border-slate-100',
    cardBorder: 'border-slate-200/80',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    textInverse: 'text-white',
    accentColor: 'indigo',
    accentBg: 'bg-indigo-600',
    accentText: 'text-indigo-600',
    accentBorder: 'border-indigo-600/15',
    accentHoverBg: 'bg-indigo-600 hover:bg-indigo-700',
    accentRipples: 'shadow-indigo-600/5',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200 focus:border-indigo-600/50 focus:ring-indigo-600/20',
    inputText: 'text-slate-800',
    glowAccent: 'shadow-md shadow-indigo-100/40'
  }
};

/**
 * Access a loaded Theme from storage or fallback.
 * @returns {ThemeId} Configured theme ID.
 */
export function getSavedThemeId(): ThemeId {
  try {
    const saved = localStorage.getItem('smc_theme_id') as ThemeId;
    if (saved && THEMES[saved]) return saved;
  } catch (e) {}
  return 'midnight';
}

/**
 * Save theme preference to localStorage.
 * @param {ThemeId} themeId - Target theme choice.
 */
export function saveThemeId(themeId: ThemeId): void {
  try {
    localStorage.setItem('smc_theme_id', themeId);
  } catch (e) {}
}
