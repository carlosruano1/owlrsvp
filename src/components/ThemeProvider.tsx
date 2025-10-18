'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeColors = {
  bg: string;
  text: string;
  primary: string;
  secondary: string;
};

// Define preset themes
export const THEME_PRESETS = {
  dark: {
    bg: '#000000',
    text: '#FFFFFF',
    primary: '#007AFF',
    secondary: '#007AFF',
  },
  light: {
    bg: '#FFFFFF',
    text: '#000000',
    primary: '#007AFF',
    secondary: '#007AFF',
  },
  midnight: {
    bg: '#121212',
    text: '#FFFFFF',
    primary: '#6200EA',
    secondary: '#03DAC6',
  },
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
  themeKey?: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialColors?: Partial<ThemeColors>;
  themeKey?: string; // Optional key for storing in localStorage
}

export function ThemeProvider({ 
  children, 
  initialColors = {}, 
  themeKey = 'owlrsvp_theme' 
}: ThemeProviderProps) {
  // Initialize with dark theme and override with initialColors
  const [colors, setColorsState] = useState<ThemeColors>({
    ...THEME_PRESETS.dark,
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

  // Apply colors to CSS variables whenever colors change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Apply main colors
    document.documentElement.style.setProperty('--theme-bg', colors.bg);
    document.documentElement.style.setProperty('--theme-text', colors.text);
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    
    // Apply derived colors
    document.documentElement.style.setProperty('--theme-primary-alpha', `${colors.primary}33`);
    document.documentElement.style.setProperty('--theme-secondary-alpha', `${colors.secondary}33`);
    
    // Update legacy variables
    document.documentElement.style.setProperty('--background', colors.bg);
    document.documentElement.style.setProperty('--foreground', colors.text);
    document.documentElement.style.setProperty('--company-color', colors.primary);
    document.documentElement.style.setProperty('--company-color-alpha', `${colors.primary}33`);
    document.documentElement.style.setProperty('--spotlight-color', colors.secondary);
    document.documentElement.style.setProperty('--spotlight-color-alpha', `${colors.secondary}33`);
    
    // Adjust styles based on background brightness
    const isDarkBg = getBrightness(colors.bg) < 128;
    
    // Glass card styles
    document.documentElement.style.setProperty(
      '--theme-card-bg', 
      isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
    );
    document.documentElement.style.setProperty(
      '--theme-border', 
      isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    );
    document.documentElement.style.setProperty(
      '--theme-shadow', 
      isDarkBg ? 'rgba(0,0,0,0.36)' : 'rgba(0,0,0,0.1)'
    );
    
    // Form field styles
    document.documentElement.style.setProperty(
      '--field-bg', 
      isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)'
    );
    document.documentElement.style.setProperty(
      '--field-border', 
      isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
    );
    document.documentElement.style.setProperty(
      '--field-focus-ring', 
      `${colors.primary}40`
    );
    
    // Update accent gradient
    document.documentElement.style.setProperty(
      '--accent-gradient', 
      isDarkBg 
        ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))' 
        : 'linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))'
    );
  }, [colors]);

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

  return (
    <ThemeContext.Provider value={{ colors, setColors, applyPreset, saveTheme, themeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to calculate brightness (0-255)
function getBrightness(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
