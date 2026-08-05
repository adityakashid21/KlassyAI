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
    ScrollView,
    SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, User, ArrowRight, ArrowLeft, GraduationCap, Users, Building, Coins } from 'lucide-react-native';

type UserRole = 'student' | 'teacher';

export default function RegisterScreen() {
    const navigation = useNavigation<any>();
    const [role, setRole] = useState<UserRole>('student');
    const [loading, setLoading] = useState(false);

    // Common Fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    // Student Fields
    const [teacherCode, setTeacherCode] = useState('');
    const [grade, setGrade] = useState('');

    // Teacher Fields
    const [tuitionName, setTuitionName] = useState('');
    const [monthlyFee, setMonthlyFee] = useState('');
    const [address, setAddress] = useState('');

    async function signUp() {
        if (!fullName || !email || !password) {
            Alert.alert('Missing Fields', 'Please fill in all common fields.');
            return;
        }

        if (role === 'student' && !teacherCode) {
            Alert.alert('Missing Code', 'Please enter the 6-digit Teacher Code.');
            return;
        }

        if (role === 'teacher' && !tuitionName) {
            Alert.alert('Missing Details', 'Please enter your Tuition Name.');
            return;
        }

        setLoading(true);

        try {
            let teacherId: string | null = null;

            // 1. Verify Teacher Code if Student
            if (role === 'student') {
                const { data: teacher, error: teacherError } = await supabase
                    .from('teachers')
                    .select('id')
                    .eq('unique_code', teacherCode.toUpperCase())
                    .maybeSingle();

                if (teacherError || !teacher) {
                    Alert.alert('Error', 'Invalid teacher code');
                    setLoading(false);
                    return;
                }
                teacherId = teacher.id;
            }

            // 2. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: { full_name: fullName },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create user");

            // 3. Create Role Specific Profile
            if (role === 'teacher') {
                const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                const { error: insertError } = await supabase
                    .from('teachers')
                    .insert({
                        user_id: authData.user.id,
                        name: fullName,
                        email: email,
                        phone: phone || null,
                        unique_code: uniqueCode,
                        tuition_name: tuitionName,
                        address: address || null,
                        monthly_fee: monthlyFee ? parseFloat(monthlyFee) : 0,
                        payment_modes: ["Cash", "UPI"], // Default
                    });
                if (insertError) throw insertError;
                Alert.alert('Success', `Account created! Your code: ${uniqueCode}`);
            } else {
                const { error: insertError } = await supabase
                    .from('students')
                    .insert({
                        user_id: authData.user.id,
                        name: fullName,
                        email: email,
                        phone: phone || null,
                        grade: grade || null,
                        teacher_id: teacherId,
                    });
                if (insertError) throw insertError;
                Alert.alert('Success', 'Account created! Verify your email.');
            }

            navigation.navigate('Login');

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.mainContainer}>
            <LinearGradient
                colors={[COLORS.background, '#0f1f26', '#091014']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.contentContainer}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft color={COLORS.textSecondary} size={24} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Join KlassyAI</Text>
                            <Text style={styles.subtitle}>Create your account as</Text>
                        </View>

                        {/* Role Toggle */}
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
                                onPress={() => setRole('student')}
                            >
                                <GraduationCap size={24} color={role === 'student' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roleButton, role === 'teacher' && styles.roleButtonActive]}
                                onPress={() => setRole('teacher')}
                            >
                                <Users size={24} color={role === 'teacher' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Teacher</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formCard}>
                            {/* Common Fields */}
                            <InputGroup icon={<User />} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
                            <InputGroup icon={<Mail />} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
                            <InputGroup icon={<Lock />} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                            <InputGroup icon={<User />} placeholder="Phone (Optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                            {/* Role Specific Fields */}
                            {role === 'student' ? (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>Student Details</Text>
                                    <InputGroup
                                        icon={<Lock />}
                                        placeholder="Teacher Code (6-digit)"
                                        value={teacherCode}
                                        onChangeText={(t: string) => setTeacherCode(t.toUpperCase())}
                                        maxLength={6}
                                    />
                                    <InputGroup icon={<GraduationCap />} placeholder="Grade/Class" value={grade} onChangeText={setGrade} />
                                </>
                            ) : (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>Tuition Details</Text>
                                    <InputGroup icon={<Building />} placeholder="Tuition Name" value={tuitionName} onChangeText={setTuitionName} />
                                    <InputGroup icon={<Coins />} placeholder="Monthly Fee" value={monthlyFee} onChangeText={setMonthlyFee} keyboardType="numeric" />
                                    <InputGroup icon={<Building />} placeholder="Address" value={address} onChangeText={setAddress} />
                                </>
                            )}

                            <TouchableOpacity onPress={signUp} disabled={loading} style={{ marginTop: SIZES.m }}>
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
                                            <Text style={styles.buttonText}>Create Account</Text>
                                            <ArrowRight color={COLORS.white} size={20} style={styles.buttonIcon} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.link}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

// Helper Component for Inputs
const InputGroup = ({ icon, ...props }: any) => (
    <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
            <View style={{ marginRight: SIZES.s }}>
                {React.cloneElement(icon, { size: 20, color: COLORS.primary })}
            </View>
            <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
                {...props}
            />
        </View>
    </View>
);



const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.background },
    keyboardView: { flex: 1 },
    contentContainer: { padding: SIZES.l, paddingBottom: 50 },
    backButton: { marginBottom: SIZES.m },
    header: { marginBottom: SIZES.l },
    title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    subtitle: { fontSize: 16, color: COLORS.textSecondary },
    roleContainer: { flexDirection: 'row', gap: SIZES.m, marginBottom: SIZES.l },
    roleButton: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: SIZES.m,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    roleButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    roleText: { color: COLORS.textMuted, marginTop: SIZES.s, fontWeight: '600' },
    roleTextActive: { color: COLORS.white },
    formCard: { backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radiusL, ...SHADOWS.card },
    inputWrapper: { marginBottom: SIZES.m },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: SIZES.radius, paddingHorizontal: SIZES.m, borderWidth: 1, borderColor: COLORS.border, height: 50 },
    input: { flex: 1, color: COLORS.text, fontSize: 16 },
    button: { height: 56, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow },
    buttonContent: { flexDirection: 'row', alignItems: 'center' },
    buttonText: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginRight: SIZES.s },
    buttonIcon: { marginLeft: SIZES.xs },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.l },
    footerText: { color: COLORS.textSecondary },
    link: { color: COLORS.accent, fontWeight: '700' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.s },
    sectionTitle: { color: COLORS.text, fontWeight: '700', marginBottom: SIZES.m, fontSize: 16 },
});
