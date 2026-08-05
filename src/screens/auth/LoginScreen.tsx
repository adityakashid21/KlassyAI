import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react-native';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
        });

        if (error) {
            Alert.alert('Login Failed', error.message);
        }
        setLoading(false);
    }

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            {/* Background Gradient */}
            <LinearGradient
                colors={[COLORS.background, '#0f1f26', '#091014']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.contentContainer}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={COLORS.gradients.primary}
                                style={styles.logoIcon}
                            >
                                <Zap size={32} color={COLORS.white} fill={COLORS.white} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Log in to your <Text style={styles.brandText}>KlassyAI</Text> account
                        </Text>
                    </View>

                    {/* Form Section - Glassmorphism Card */}
                    <View style={styles.formCard}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputContainer}>
                                <Mail color={COLORS.primary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock color={COLORS.primary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => { }}>
                            <Text style={styles.forgotPassword}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={signInWithEmail}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={COLORS.gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.buttonText}>Sign In</Text>
                                        <ArrowRight color={COLORS.white} size={20} style={styles.buttonIcon} />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.link}>Sign Up Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    contentContainer: {
        padding: SIZES.l,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SIZES.xl,
    },
    iconContainer: {
        marginBottom: SIZES.l,
        ...SHADOWS.glow,
    },
    logoIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SIZES.xs,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    brandText: {
        color: COLORS.primaryGlow,
        fontWeight: '700',
    },
    formCard: {
        backgroundColor: COLORS.surface,
        padding: SIZES.l,
        borderRadius: SIZES.radiusL,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    inputWrapper: {
        marginBottom: SIZES.m,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: SIZES.xs,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background, // Inner dark input
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 56,
    },
    inputIcon: {
        marginRight: SIZES.s,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        height: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        color: COLORS.primaryGlow,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SIZES.l,
    },
    button: {
        height: 56,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.glow,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
        marginRight: SIZES.s,
    },
    buttonIcon: {
        marginLeft: SIZES.xs,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SIZES.xl,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    link: {
        color: COLORS.accent,
        fontWeight: '700',
        fontSize: 14,
    },
});
