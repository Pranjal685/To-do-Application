/**
 * Premium Design System Utilities
 * 
 * This file contains utility functions and constants for the premium UI system
 * featuring Minimal Luxury × Futuristic Glassmorphism aesthetic
 */

import { cn } from './utils';

/**
 * Premium Color Palette Constants
 * Professional, calm, focused design system
 */
export const COLORS = {
  // Primary Backgrounds
  PEARL_WHITE: '#F5F5F4',
  CHARCOAL_GRAPHITE: '#0F0F0F',

  // Cards / Surfaces
  FROSTED_GLASS_LIGHT: 'rgba(255, 255, 255, 0.1)',
  SMOKED_GLASS_DARK: 'rgba(23, 23, 23, 0.8)',

  // Accent Colors - Professional Muted Indigo
  PRIMARY_ACCENT: '#6366F1',      // Muted Indigo - light mode
  PRIMARY_ACCENT_DARK: '#818CF8', // Indigo-400 - dark mode
  ACCENT_MUTED: '#9CA3AF',        // Neutral gray

  // Status Colors - Muted, not flashy
  SUCCESS: '#22C55E',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',

  // Typography
  PRIMARY_LIGHT: '#1C1C1C',
  PRIMARY_DARK: '#F5F5F4',
  SECONDARY_LIGHT: '#71717A',
  SECONDARY_DARK: '#A3A3A3',
} as const;

/**
 * Premium Animation Presets
 */
export const ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
} as const;

/**
 * Premium Glassmorphism Classes
 */
export const glassClasses = {
  light: 'glass-light',
  dark: 'glass-dark',
  card: 'glass-card',
  premium: 'glass-card border-primary/20 hover:border-primary/30',
} as const;

/**
 * Premium Glow Effects
 */
export const glowClasses = {
  gold: 'glow-gold',
  teal: 'glow-teal',
  goldHover: 'glow-gold-hover',
  tealHover: 'glow-teal-hover',
} as const;

/**
 * Premium Gradient Classes
 */
export const gradientClasses = {
  textGold: 'gradient-text-gold',
  textTeal: 'gradient-text-teal',
  text: 'gradient-text',
  bgGold: 'gradient-bg-gold',
  bgTeal: 'gradient-bg-teal',
  bg: 'gradient-bg',
} as const;

/**
 * Utility function to combine premium classes
 */
export function getPremiumClasses(
  variant: 'glass' | 'premium' | 'elevated' = 'glass',
  glow?: 'gold' | 'teal',
  gradient?: 'gold' | 'teal'
) {
  return cn(
    variant === 'glass' && glassClasses.card,
    variant === 'premium' && glassClasses.premium,
    variant === 'elevated' && 'shadow-premium',
    glow === 'gold' && glowClasses.goldHover,
    glow === 'teal' && glowClasses.tealHover,
    gradient === 'gold' && gradientClasses.textGold,
    gradient === 'teal' && gradientClasses.textTeal
  );
}

/**
 * Premium hover effects
 */
export const hoverEffects = {
  lift: 'hover-lift',
  glow: 'hover-glow',
  scale: 'hover:scale-105 active:scale-95',
} as const;

