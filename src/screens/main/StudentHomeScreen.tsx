import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
    BookOpen, TrendingUp, Bell, CalendarCheck,
    DollarSign, User, Zap, Award, HelpCircle
} from 'lucide-react-native';

export default function StudentHomeScreen() {
    const navigation = useNavigation<any>();
    const [student, setStudent] = useState<any>(null);
    const [notices, setNotices] = useState<any[]>([]);
    const [attendancePercent, setAttendancePercent] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Student Details
        const { data: studentData } = await supabase
            .from('students')
            .select('*, teachers(tuition_name)')
            .eq('user_id', user.id)
            .single();

        if (studentData) {
            // Prevent infinite re-render loop by checking if data actually changed
            // Using ID check is simplest, or JSON stringify for full object equality
            setStudent(prev => {
                if (prev?.id === studentData.id) return prev;
                return studentData;
            });

            // 1. Fetch Notices
            const { data: noticesData } = await supabase
                .from('notices')
                .select('*')
                .eq('teacher_id', studentData.teacher_id)
                .order('created_at', { ascending: false })
                .limit(3);
            setNotices(noticesData || []);

            // 2. Calculate Attendance %
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', studentData.id);

            if (attendanceData && attendanceData.length > 0) {
                // Safety check for status. Count 'late' as present for percentage.
                const present = attendanceData.filter(a => {
                    const s = a.status?.toLowerCase();
                    return s === 'present' || s === 'late';
                }).length;
                const percentage = Math.round((present / attendanceData.length) * 100);
                setAttendancePercent(percentage);
            } else {
                setAttendancePercent(0);
            }
        }
    };

    // Separate Effect for Realtime Subscription
    useEffect(() => {
        if (!student) return;

        const channels = supabase.channel('student-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notices', filter: `teacher_id=eq.${student.teacher_id}` },
                () => fetchData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance', filter: `student_id=eq.${student.id}` },
                () => fetchData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, [student]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ padding: SIZES.m, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                >
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.username}>{student?.name || 'Student'}</Text>
                        </View>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                            <User size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* AI Tutor Hero Card */}
                    <TouchableOpacity
                        style={styles.heroCard}
                        onPress={() => navigation.navigate('AITutor', { studentName: student?.name })}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, '#4f80e1']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.heroGradient}
                        >
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Zap size={20} color={COLORS.warning} fill={COLORS.warning} />
                                    <Text style={styles.heroBadge}>AI POWERED</Text>
                                </View>
                                <Text style={styles.heroTitle}>Stuck on a concept?</Text>
                                <Text style={styles.heroSubtitle}>Ask your AI Tutor anytime!</Text>
                            </View>
                            <BookOpen size={48} color={COLORS.white} style={{ opacity: 0.9 }} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Quick Actions Scroll */}
                    <View style={{ marginBottom: SIZES.l }}>
                        <Text style={styles.sectionLabel}>Quick Actions</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SIZES.m }} contentContainerStyle={{ paddingHorizontal: SIZES.m }}>
                            <QuickAction icon={<HelpCircle />} label="Ask Doubt" onPress={() => navigation.navigate('AITutor')} />
                            <QuickAction icon={<CalendarCheck />} label="Attendance" onPress={() => navigation.navigate('Attendance')} />
                            <QuickAction icon={<DollarSign />} label="Pay Fees" onPress={() => navigation.navigate('Fees')} />
                            <QuickAction icon={<Award />} label="Results" onPress={() => navigation.navigate('StudentMarks')} />
                            <QuickAction icon={<TrendingUp />} label="Analytics" onPress={() => navigation.navigate('StudentAnalytics')} />
                        </ScrollView>
                    </View>

                    {/* Progress Overview Section */}
                    <View style={styles.rowContainer}>
                        {/* Attendance Box */}
                        <View style={[styles.progressBox, { marginRight: SIZES.m }]}>
                            <Text style={styles.boxTitle}>Attendance</Text>
                            <View style={styles.circularProgress}>
                                <Text style={styles.progressText}>{attendancePercent}%</Text>
                            </View>
                            <Text style={styles.boxSubtitle}>Present Days</Text>
                        </View>

                        {/* Recent Performance Box (Placeholder) */}
                        <View style={styles.progressBox}>
                            <Text style={styles.boxTitle}>Last Score</Text>
                            <View style={[styles.circularProgress, { borderColor: COLORS.warning }]}>
                                <Text style={[styles.progressText, { color: COLORS.warning }]}>A+</Text>
                            </View>
                            <Text style={styles.boxSubtitle}>Mathematics</Text>
                        </View>
                    </View>



                    {/* Recent Notices */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Announcements</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Notices')}>
                                <Text style={styles.linkText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.noticeList}>
                            {notices.length === 0 ? (
                                <Text style={styles.emptyText}>No recent notices.</Text>
                            ) : (
                                notices.map(notice => <NotificationItem key={notice.id} item={notice} />)
                            )}
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const NotificationItem = ({ item }: { item: any }) => (
    <View style={styles.noticeItem}>
        <View style={styles.noticeIcon}>
            <Bell size={16} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.noticeContent}>{item.content}</Text>
            <Text style={styles.noticeDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
    </View>
);

const QuickAction = ({ icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
        <View style={styles.quickIconBox}>
            {React.cloneElement(icon, { size: 20, color: COLORS.text })}
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.l,
        marginTop: Platform.OS === 'android' ? 40 : SIZES.l
    },
    greeting: { fontSize: 14, color: COLORS.textSecondary },
    username: { fontSize: 24, fontWeight: '700', color: COLORS.text },
    profileBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 20 },

    // Hero Card
    heroCard: { borderRadius: SIZES.radiusL, overflow: 'hidden', marginBottom: SIZES.l, ...SHADOWS.card },
    heroGradient: { flexDirection: 'row', padding: SIZES.l, alignItems: 'center', justifyContent: 'space-between' },
    heroBadge: { color: COLORS.warning, fontWeight: 'bold', fontSize: 12 },
    heroTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white, marginBottom: 4 },
    heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

    // Quick Actions
    sectionLabel: { color: COLORS.textSecondary, marginBottom: SIZES.m, fontWeight: '600', marginLeft: 4 },
    quickAction: { alignItems: 'center', marginRight: SIZES.l },
    quickIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
    quickLabel: { color: COLORS.text, fontSize: 12, fontWeight: '500' },

    // Progress Section
    rowContainer: { flexDirection: 'row', marginBottom: SIZES.l },
    progressBox: { flex: 1, backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radiusL, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    boxTitle: { color: COLORS.textSecondary, marginBottom: SIZES.m, fontSize: 12, fontWeight: '600' },
    circularProgress: { width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    progressText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
    boxSubtitle: { color: COLORS.textMuted, fontSize: 10 },



    // Section
    sectionContainer: { marginBottom: SIZES.l },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.m },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

    // General
    linkText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
    noticeList: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.m },
    noticeItem: { flexDirection: 'row', marginBottom: SIZES.m, paddingBottom: SIZES.m, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    noticeIcon: { marginRight: SIZES.m, marginTop: 2 },
    noticeTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
    noticeContent: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
    noticeDate: { fontSize: 10, color: COLORS.textMuted },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, padding: SIZES.m }
});
