import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import { GraduationCap, Brain, BookOpen } from 'lucide-react-native';

export default function LoadingScreen() {
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0.8)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Spinning animation for the icon
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulsing scale animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 0.8,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Fade in animation
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, '#0f1f26', COLORS.background]}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        transform: [{ scale: scaleValue }, { rotate: spin }],
                        opacity: fadeValue,
                    },
                ]}
            >
                <View style={styles.iconCircle}>
                    <GraduationCap size={48} color={COLORS.primary} strokeWidth={2.5} />
                </View>
            </Animated.View>

            <Animated.View style={[styles.textContainer, { opacity: fadeValue }]}>
                <Text style={styles.appName}>KlassyAI</Text>
                <Text style={styles.tagline}>Smart Learning Assistant</Text>
            </Animated.View>

            {/* Animated dots */}
            <View style={styles.dotsContainer}>
                <AnimatedDot delay={0} />
                <AnimatedDot delay={200} />
                <AnimatedDot delay={400} />
            </View>
        </View>
    );
}

const AnimatedDot = ({ delay }: { delay: number }) => {
    const dotScale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotScale, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotScale, {
                        toValue: 0.5,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, delay);
    }, []);

    return (
        <Animated.View
            style={[
                styles.dot,
                {
                    transform: [{ scale: dotScale }],
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    logoContainer: {
        marginBottom: 40,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary + '20',
        borderWidth: 3,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
});
