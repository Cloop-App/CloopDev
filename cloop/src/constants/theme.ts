import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
    primary: '#EF4444', // Red 500 - Vibrant Red
    primaryDark: '#DC2626', // Red 600
    primaryLight: '#FCA5A5', // Red 300

    secondary: '#F59E0B', // Amber 500 - Vibrant Yellow/Orange
    secondaryDark: '#D97706', // Amber 600
    secondaryLight: '#FCD34D', // Amber 300

    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    error: '#EF4444', // Red 500
    info: '#3B82F6', // Blue 500

    background: '#FFFBEB', // Amber 50 - Warm background
    surface: '#FFFFFF',

    text: {
        primary: '#1F2937', // Gray 800
        secondary: '#4B5563', // Gray 600
        light: '#9CA3AF', // Gray 400
        white: '#FFFFFF',
    },

    border: '#FDE68A', // Amber 200
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const SIZES = {
    width,
    height,
    radius: {
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
        round: 999,
    },
};

export const SHADOWS = {
    small: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const TYPOGRAPHY = {
    h1: { fontSize: 32, fontWeight: '800' as const, color: COLORS.text.primary },
    h2: { fontSize: 24, fontWeight: '700' as const, color: COLORS.text.primary },
    h3: { fontSize: 20, fontWeight: '700' as const, color: COLORS.text.primary },
    body: { fontSize: 16, color: COLORS.text.secondary, lineHeight: 24 },
    caption: { fontSize: 14, color: COLORS.text.light },
    button: { fontSize: 16, fontWeight: '600' as const, color: COLORS.text.white },
};

export const THEME = {
    colors: COLORS,
    spacing: SPACING,
    sizes: SIZES,
    shadows: SHADOWS,
    typography: TYPOGRAPHY,
};
