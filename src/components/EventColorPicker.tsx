'use client';

import React, { useState, useCallback } from 'react';
import { useTheme, TIER_DEFAULTS, ThemeColors } from './ThemeProvider';

interface EventColorPickerProps {
  onSave?: () => void;
  className?: string;
  tier?: string;
}

interface ColorPreset {
  name: string;
  colors: ThemeColors;
  description: string;
}

// Color presets organized by tier
const COLOR_PRESETS: Record<string, ColorPreset[]> = {
  basic: [
    {
      name: 'Classic Blue',
      colors: { bg: '#1e293b', text: '#ffffff', primary: '#3b82f6', secondary: '#3b82f6' },
      description: 'Clean blue theme'
    },
    {
      name: 'Modern Purple',
      colors: { bg: '#1e1b4b', text: '#ffffff', primary: '#8b5cf6', secondary: '#8b5cf6' },
      description: 'Elegant purple tones'
    },
    {
      name: 'Forest Green',
      colors: { bg: '#0f172a', text: '#ffffff', primary: '#059669', secondary: '#059669' },
      description: 'Natural green palette'
    },
    {
      name: 'Ocean Blue',
      colors: { bg: '#0c4a6e', text: '#ffffff', primary: '#0284c7', secondary: '#0284c7' },
      description: 'Deep ocean blues'
    }
  ],
  pro: [
    {
      name: 'Midnight',
      colors: { bg: '#0f172a', text: '#ffffff', primary: '#8b5cf6', secondary: '#06b6d4' },
      description: 'Dark with violet and cyan accents'
    },
    {
      name: 'Sunset',
      colors: { bg: '#1e1b4b', text: '#ffffff', primary: '#f59e0b', secondary: '#ef4444' },
      description: 'Warm amber and red tones'
    },
    {
      name: 'Corporate',
      colors: { bg: '#0c0a09', text: '#ffffff', primary: '#374151', secondary: '#6b7280' },
      description: 'Professional gray tones'
    },
    {
      name: 'Tech',
      colors: { bg: '#0f172a', text: '#ffffff', primary: '#10b981', secondary: '#3b82f6' },
      description: 'Modern tech colors'
    },
    {
      name: 'Luxury',
      colors: { bg: '#1c1917', text: '#ffffff', primary: '#d4af37', secondary: '#8b5cf6' },
      description: 'Gold and purple luxury theme'
    },
    {
      name: 'Nature',
      colors: { bg: '#0f172a', text: '#ffffff', primary: '#059669', secondary: '#84cc16' },
      description: 'Fresh green and lime'
    }
  ]
};

export default function EventColorPicker({
  onSave,
  className = '',
  tier = 'basic'
}: EventColorPickerProps) {
  const { colors, setColors, saveTheme, resetToTierDefault } = useTheme();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customColors, setCustomColors] = useState<ThemeColors>(colors);

  // Get available presets based on tier
  const availablePresets = COLOR_PRESETS[tier] || COLOR_PRESETS.basic;

  // Calculate if text should be dark or light based on background
  const getTextColor = useCallback((bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#000000' : '#FFFFFF';
  }, []);

  const handlePresetSelect = (preset: ColorPreset) => {
    setColors(preset.colors);
    setCustomColors(preset.colors);
  };

  const handleCustomColorChange = (colorKey: keyof ThemeColors, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    setColors(newColors);
  };

  const handleResetToDefault = () => {
    resetToTierDefault(tier);
    setCustomColors(TIER_DEFAULTS[tier as keyof typeof TIER_DEFAULTS] || TIER_DEFAULTS.free);
  };

  const handleSave = () => {
    saveTheme();
    if (onSave) onSave();
  };

  const ColorInput = ({
    label,
    value,
    onChange,
    description
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/90">
        {label}
      </label>
      <div className="flex gap-3 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm placeholder-white/40 focus:border-white/40 focus:ring-1 focus:ring-white/40"
        />
      </div>
      <p className="text-xs text-white/60">{description}</p>
    </div>
  );

  return (
    <div className={`event-color-picker ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'presets'
              ? 'border-white text-white'
              : 'border-transparent text-white/60 hover:text-white/80'
          }`}
        >
          Color Presets
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-white text-white'
              : 'border-transparent text-white/60 hover:text-white/80'
          }`}
        >
          Custom Colors
        </button>
      </div>

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          <div className="text-sm text-white/70 mb-4">
            Choose from professionally designed color schemes for your {tier} plan.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availablePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`group relative rounded-xl p-4 border-2 transition-all hover:scale-[1.02] ${
                  JSON.stringify(preset.colors) === JSON.stringify(colors)
                    ? 'border-white shadow-lg shadow-white/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                style={{ backgroundColor: preset.colors.bg }}
              >
                {/* Color indicators */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full border border-white/30"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/30"
                    style={{ backgroundColor: preset.colors.secondary }}
                  />
                </div>

                {/* Preview text */}
                <div className="text-left">
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ color: getTextColor(preset.colors.bg) }}
                  >
                    {preset.name}
                  </h3>
                  <p
                    className="text-xs opacity-80"
                    style={{ color: getTextColor(preset.colors.bg) }}
                  >
                    {preset.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {JSON.stringify(preset.colors) === JSON.stringify(colors) && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 text-sm text-white/70 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-colors"
            >
              Reset to {tier} Default
            </button>
          </div>
        </div>
      )}

      {/* Custom Colors Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <div className="text-sm text-white/70 mb-4">
            Customize your event colors. Changes apply instantly.
          </div>

          {/* Live Preview */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
            <div className="text-xs text-white/60 px-3 py-2 bg-black/30">Live Preview:</div>
            <div
              className="relative overflow-hidden h-24"
              style={{ backgroundColor: customColors.bg }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: customColors.text }}
                  >
                    Event Title
                  </div>
                  <div
                    className="w-8 h-1 rounded-full mx-auto"
                    style={{ backgroundColor: customColors.primary }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ColorInput
              label="Background"
              value={customColors.bg}
              onChange={(value) => handleCustomColorChange('bg', value)}
              description="Main background color"
            />
            <ColorInput
              label="Text"
              value={customColors.text}
              onChange={(value) => handleCustomColorChange('text', value)}
              description="Text and icon color"
            />
            <ColorInput
              label="Primary"
              value={customColors.primary}
              onChange={(value) => handleCustomColorChange('primary', value)}
              description="Buttons and accents"
            />
            <ColorInput
              label="Secondary"
              value={customColors.secondary}
              onChange={(value) => handleCustomColorChange('secondary', value)}
              description="Secondary highlights"
            />
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 text-sm text-white/70 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
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