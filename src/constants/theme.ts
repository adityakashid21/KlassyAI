export const COLORS = {
    // Brand Colors (from CSS Variables)
    primary: '#1FAEA7', // hsl(174, 72%, 40%) - Teal
    primaryGlow: '#2DD4BF', // hsl(174, 72%, 55%)
    accent: '#F26D47', // hsl(12, 90%, 62%) - Coral
    accentGlow: '#F59678', // hsl(12, 90%, 72%)

    // Dark Mode Colors (Defaulting to Dark for Premium Feel)
    background: '#0E151A', // hsl(200, 30%, 8%)
    surface: '#15232D', // hsl(200, 25%, 13%) - Slightly lighter than bg
    surfaceLight: '#1E2D38', // hsl(200, 25%, 17%)

    // Text Colors
    text: '#F0FDFA', // hsl(180, 20%, 95%)
    textSecondary: '#94A8B3', // hsl(180, 15%, 55%) lighter for contrast on dark
    textMuted: '#5F7380',

    // Functional Colors
    error: '#EF4444', // Destructive
    success: '#10B981',
    warning: '#F59E0B',
    info: '#0EA5E9',

    // Utility Colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    border: '#24333E', // hsl(200, 20%, 22%)

    // Gradients (Represented as array of colors for react-native-linear-gradient)
    gradients: {
        primary: ['#1FAEA7', '#2DD4BF', '#18B3C7'], // Gradient Primary
        accent: ['#F26D47', '#FB923C'], // Gradient Accent
        hero: ['#115E59', '#155E75', '#4C1D95'], // Gradient Hero (approx)
        card: ['#15232D', '#121E26'], // Gradient Card
        glass: ['rgba(30, 40, 50, 0.9)', 'rgba(30, 40, 50, 0.6)'],
    }
};

export const SIZES = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
    radius: 16, // --radius: 1rem (16px)
    radiusL: 24,
    radiusXL: 32,
};

export const FONTS = {
    // Mapping 'Space Grotesk' and 'Outfit' to System weights for now
    // In a real app, we would link the actual font files
    heading: {
        fontFamily: 'System',
        fontWeight: '700',
    },
    subHeading: {
        fontFamily: 'System',
        fontWeight: '600',
    },
    body: {
        fontFamily: 'System',
        fontWeight: '400',
    },
    medium: {
        fontFamily: 'System',
        fontWeight: '500',
    },
};

export const SHADOWS = {
    soft: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    glow: {
        shadowColor: COLORS.primaryGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 5,
    },
};
