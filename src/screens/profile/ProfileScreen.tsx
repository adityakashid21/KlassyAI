import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { User, LogOut, ChevronRight, BookOpen, CreditCard, Bell } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const [profile, setProfile] = useState<any>(null);
    const [role, setRole] = useState<'teacher' | 'student' | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try Teacher
        let { data: teacher } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
        if (teacher) {
            setProfile(teacher);
            setRole('teacher');
            return;
        }

        // Try Student
        let { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
        if (student) {
            setProfile(student);
            setRole('student');
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    };

    const ProfileOption = ({ icon, label, onPress, color = COLORS.primary }: any) => (
        <TouchableOpacity style={styles.optionRow} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                {React.cloneElement(icon, { size: 20, color: color })}
            </View>
            <Text style={styles.optionLabel}>{label}</Text>
            <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: SIZES.l }}>

                    <View style={styles.header}>
                        <Text style={styles.pageTitle}>My Profile</Text>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{profile?.name?.charAt(0) || 'U'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{profile?.name || 'Loading...'}</Text>
                            <Text style={styles.email}>{profile?.email}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{role?.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Options */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                        <ProfileOption
                            icon={<User />}
                            label="Edit Profile"
                            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
                        />
                        <ProfileOption
                            icon={<Bell />}
                            label="Notifications"
                            color={COLORS.accent}
                            onPress={() => { }}
                        />
                        <ProfileOption
                            icon={<CreditCard />}
                            label="Subscription"
                            color={COLORS.success}
                            onPress={() => { }}
                        />
                    </View>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <LogOut size={20} color={COLORS.error} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.version}>Version 1.0.0</Text>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { marginBottom: SIZES.l },
    pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.l, borderRadius: SIZES.radiusL, marginBottom: SIZES.xl, ...SHADOWS.card },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.m },
    avatarText: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
    name: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    email: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
    roleBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    roleText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted },
    section: { marginBottom: SIZES.xl },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SIZES.m, marginLeft: 4 },
    optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radius, marginBottom: SIZES.s },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.m },
    optionLabel: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.m, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: SIZES.radius, marginBottom: SIZES.l },
    logoutText: { color: COLORS.error, fontWeight: '700', marginLeft: SIZES.s, fontSize: 16 },
    version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }
});
