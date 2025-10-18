'use client';

import React from 'react';
import { useTheme, THEME_PRESETS } from './ThemeProvider';

interface ThemeColorPickerProps {
  onSave?: () => void;
  className?: string;
}

export default function ThemeColorPicker({ 
  onSave, 
  className = ''
}: ThemeColorPickerProps) {
  const { colors, applyPreset, saveTheme } = useTheme();
  
  // Handle saving colors
  const handleSave = () => {
    saveTheme();
    if (onSave) onSave();
  };
  
  // Calculate if text should be dark or light based on background
  const getTextColor = (bgColor: string) => {
    // Remove # if present
    const hex = bgColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black for bright backgrounds, white for dark
    return brightness > 125 ? '#000000' : '#FFFFFF';
  };
  
  return (
    <div className={`theme-color-picker ${className}`}>
      {/* Theme Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {Object.entries(THEME_PRESETS).map(([name, theme]) => (
          <button
            key={name}
            onClick={() => applyPreset(name as keyof typeof THEME_PRESETS)}
            className={`rounded-xl p-4 border-2 transition-all hover:scale-105 ${
              JSON.stringify(theme) === JSON.stringify(colors) 
                ? 'border-white' 
                : 'border-transparent'
            }`}
            style={{ backgroundColor: theme.bg }}
          >
            <div className="flex flex-col items-center">
              <div 
                className="w-full h-6 rounded-md mb-2" 
                style={{ backgroundColor: theme.primary }}
              ></div>
              <div 
                className="text-xs font-medium capitalize" 
                style={{ color: getTextColor(theme.bg) }}
              >
                {name}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Theme Preview */}
      <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
        <div className="text-xs text-white/60 px-3 py-2 bg-black/30">Theme Preview:</div>
        <div className="relative overflow-hidden" style={{ backgroundColor: colors.bg }}>
          {/* Header area */}
          <div className="h-24 relative overflow-hidden" style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}88 100%)` 
          }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-70"></div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="font-semibold text-shadow-sm" style={{ color: colors.text }}>Event Title</h3>
                <div className="text-xs text-shadow-sm" style={{ color: `${colors.text}CC` }}>Company Name</div>
              </div>
            </div>
          </div>
          
          {/* Content area */}
          <div className="h-16 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]" style={{ 
              background: `radial-gradient(circle at center, ${colors.secondary}33 0%, transparent 70%)` 
            }}></div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center text-xs" style={{ color: colors.text }}>
                Content with spotlight effect
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="modern-button px-6 py-2"
        >
          Save Theme
        </button>
      </div>
    </div>
  );
}
