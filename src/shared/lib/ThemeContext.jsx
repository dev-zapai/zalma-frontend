import React, { createContext, useContext, useMemo } from 'react';
import { getThemeTemplate } from './themeTemplates';

const ThemeContext = createContext(null);

export function SalonThemeProvider({ siteData, children }) {
  const value = useMemo(() => {
    const templateId = siteData?.theme_template || 'clean';
    const template = getThemeTemplate(templateId);
    // Allow tenant's custom theme color to override the template default
    const themeColor = siteData?.website_theme_color || template.colors.primary;
    const secondaryColor = siteData?.website_secondary_color || template.colors.secondary;

    return {
      site: siteData,
      themeColor,
      secondaryColor,
      template,
      templateId,
      fonts: template.fonts,
      layout: template.layout,
      colors: template.colors,
      decorations: template.decorations,
      gradient: `linear-gradient(135deg, ${themeColor}, ${secondaryColor})`,
      accentBg: (opacity) => `${themeColor}${opacity || '15'}`,
      isLuxe: templateId === 'luxe',
      isPlayful: templateId === 'playful',
      isClean: templateId === 'clean',
      isWarm: templateId === 'warm',
    };
  }, [siteData]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within SalonThemeProvider');
  return ctx;
}
