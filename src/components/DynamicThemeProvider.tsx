import { useEffect } from 'react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

/**
 * Applies the company's custom primary color as CSS custom properties
 * so the entire design system reflects the company's branding.
 */
function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const DynamicThemeProvider = () => {
  const { settings } = useOrganizationSettings();

  useEffect(() => {
    if (!settings?.primary_color) return;

    const hsl = hexToHSL(settings.primary_color);
    if (!hsl) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--sidebar-primary', hsl);
    root.style.setProperty('--sidebar-ring', hsl);

    // Generate a lighter variant for hover/glow
    const parts = hsl.split(' ');
    if (parts.length === 3) {
      const lightness = parseInt(parts[2]);
      const lighterHSL = `${parts[0]} ${parts[1]} ${Math.min(lightness + 10, 85)}%`;
      root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${hsl}), hsl(${lighterHSL}))`);
      root.style.setProperty('--shadow-glow', `0 0 20px hsl(${hsl} / 0.3)`);
    }

    // Apply secondary color if available
    if (settings.secondary_color) {
      const secondaryHSL = hexToHSL(settings.secondary_color);
      if (secondaryHSL) {
        root.style.setProperty('--success', secondaryHSL);
      }
    }

    return () => {
      // Don't cleanup - let the colors persist
    };
  }, [settings?.primary_color, settings?.secondary_color]);

  return null;
};
