import type { Theme } from '../engine/types';

export function ThemeBadge({ theme, size = 'md' }: { theme?: Theme; size?: 'sm' | 'md' | 'lg' }) {
  if (!theme) return null;
  return (
    <span className={`theme-badge tb-${size}`} style={{ ['--h' as string]: String(theme.hue ?? 220) }} aria-hidden>
      {theme.icon}
    </span>
  );
}
