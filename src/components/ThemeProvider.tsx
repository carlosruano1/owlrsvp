'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeColors = {
  bg: string;
  text: string;
  primary: string;
  secondary: string;
};

// Define tier-based default themes
export const TIER_DEFAULTS = {
  free: {
    bg: '#0f172a', // slate-900
    text: '#ffffff',
    primary: '#00c8d8', // cyan-400
    secondary: '#00c8d8',
  },
  basic: {
    bg: '#1e293b', // slate-800
    text: '#ffffff',
    primary: '#3b82f6', // blue-500
    secondary: '#3b82f6',
  },
  pro: {
    bg: '#0f172a', // slate-900
    text: '#ffffff',
    primary: '#8b5cf6', // violet-500
    secondary: '#06b6d4', // cyan-500
  },
  enterprise: {
    bg: '#0c0a09', // stone-950
    text: '#ffffff',
    primary: '#f59e0b', // amber-500
    secondary: '#ef4444', // red-500
  },
  team: {
    bg: '#0f172a', // slate-900
    text: '#ffffff',
    primary: '#10b981', // emerald-500
    secondary: '#f59e0b', // amber-500
  },
};

// Legacy preset themes (kept for backward compatibility)
export const THEME_PRESETS = {
  dark: TIER_DEFAULTS.free,
  light: {
    bg: '#FFFFFF',
    text: '#000000',
    primary: '#007AFF',
    secondary: '#007AFF',
  },
  midnight: TIER_DEFAULTS.pro,
  sunset: {
    bg: '#1A1A2E',
    text: '#FFFFFF',
    primary: '#FF6B6B',
    secondary: '#FFD166',
  },
  forest: {
    bg: '#1E2B1B',
    text: '#FFFFFF',
    primary: '#4CAF50',
    secondary: '#8BC34A',
  },
  ocean: {
    bg: '#0A192F',
    text: '#FFFFFF',
    primary: '#00B4D8',
    secondary: '#0077B6',
  },
};

// Theme context
interface ThemeContextType {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  applyPreset: (presetName: keyof typeof THEME_PRESETS) => void;
  saveTheme: () => void;
  resetToTierDefault: (tier: string) => void;
  themeKey?: string;
  tier?: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialColors?: Partial<ThemeColors>;
  themeKey?: string; // Optional key for storing in localStorage
  tier?: string; // User's subscription tier
}

export function ThemeProvider({
  children,
  initialColors = {},
  themeKey = 'owlrsvp_theme',
  tier = 'free'
}: ThemeProviderProps) {
  // Get tier default as base
  const tierDefault = TIER_DEFAULTS[tier as keyof typeof TIER_DEFAULTS] || TIER_DEFAULTS.free;

  // Initialize with tier default and override with initialColors
  const [colors, setColorsState] = useState<ThemeColors>({
    ...tierDefault,
    ...initialColors,
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTheme = localStorage.getItem(themeKey);
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setColorsState(prevColors => ({
          ...prevColors,
          ...parsedTheme,
        }));
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
    }
  }, [themeKey]);

  // Do NOT set CSS variables on document.documentElement here.
  // Theme is applied only on the event invite page via inline styles on the invite wrapper,
  // so admin and other pages keep default UI colors.

  // Function to set colors with validation
  const setColors = (newColors: Partial<ThemeColors>) => {
    setColorsState(prevColors => ({
      ...prevColors,
      ...newColors,
    }));
  };

  // Function to apply a preset theme
  const applyPreset = (presetName: keyof typeof THEME_PRESETS) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setColorsState(preset);
    }
  };

  // Function to save theme to localStorage
  const saveTheme = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(themeKey, JSON.stringify(colors));
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  // Function to reset to tier default
  const resetToTierDefault = (userTier: string = tier) => {
    const defaultTheme = TIER_DEFAULTS[userTier as keyof typeof TIER_DEFAULTS] || TIER_DEFAULTS.free;
    setColorsState(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{
      colors,
      setColors,
      applyPreset,
      saveTheme,
      resetToTierDefault,
      themeKey,
      tier
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
