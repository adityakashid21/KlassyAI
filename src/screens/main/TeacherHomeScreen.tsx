import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Platform,
    TextInput,
    Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import {
    Users, CalendarCheck, Award, BookOpen, DollarSign,
    Copy, Check, User, Search, Plus, LogOut, Link as LinkIcon, TrendingUp
} from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

export default function TeacherHomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [teacher, setTeacher] = useState<any>(null);
    const [recentStudents, setRecentStudents] = useState<any[]>([]);
    const [studentCount, setStudentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fetch Teacher Profile
            const { data: teacherData } = await supabase
                .from('teachers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setTeacher(teacherData);

            if (teacherData) {
                // 1. Get Student Count (Efficient)
                const { count } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', teacherData.id);

                setStudentCount(count || 0);

                // 2. Get Recent 3 Students (Efficient)
                const { data: recentStudents } = await supabase
                    .from('students')
                    .select('*')
                    .eq('teacher_id', teacherData.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                setRecentStudents(recentStudents || []);
            }
        }
        setLoading(false);
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    const copyCode = () => {
        if (teacher?.unique_code) {
            // Try to make text selectable instead if Clipboard is missing
            // Or better, just alert it so they can see it clearly
            Alert.alert("Class Code", teacher.unique_code, [
                { text: "OK" },
                { text: "Copy (Select Text)", onPress: () => { /* no-op, rely on selectable text */ } }
            ]);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    const filteredStudents = recentStudents.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Start Teaching,</Text>
                            <Text style={styles.username}>{teacher?.name || 'Teacher'}</Text>
                        </View>
                        <TouchableOpacity style={styles.iconButton} onPress={() => (navigation as any).navigate('Profile')}>
                            <User size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Teacher Code Card */}
                    <LinearGradient
                        colors={COLORS.gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.codeCard}
                    >
                        <View>
                            <Text style={styles.codeLabel}>Your Class Code</Text>
                            <Text selectable={true} style={styles.codeValue}>{teacher?.unique_code || '------'}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
                            {codeCopied ? <Check size={20} color={COLORS.success} /> : <Copy size={20} color={COLORS.primary} />}
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Detailed Stats */}
                    <View style={styles.statsGrid}>
                        <StatBox icon={<Users />} count={studentCount} label="Students" color={COLORS.primary} />
                        <StatBox icon={<DollarSign />} count={'₹'} label="Fees" color={COLORS.success} />
                        <StatBox icon={<BookOpen />} count={5} label="Courses" color={COLORS.accent} />
                        <StatBox icon={<CalendarCheck />} count={'98%'} label="Attendance" color={COLORS.warning} />
                    </View>

                    {/* Analytics Entry */}
                    <TouchableOpacity style={styles.analyticsButton} onPress={() => (navigation as any).navigate('TeacherAnalytics')}>
                        <TrendingUp size={20} color={COLORS.white} />
                        <Text style={styles.analyticsButtonText}>View Detailed Analytics</Text>
                    </TouchableOpacity>

                    {/* Recent Students Preview */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Students</Text>
                        <TouchableOpacity onPress={() => (navigation as any).navigate('Students')}>
                            <Text style={{ color: COLORS.primary }}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Student List (Limited) */}
                    <View style={styles.studentList}>
                        {filteredStudents.length === 0 ? (
                            <Text style={styles.emptyText}>No students yet.</Text>
                        ) : (
                            filteredStudents.map((student: any) => (
                                <View key={student.id} style={styles.studentCard}>
                                    <View style={styles.studentAvatar}>
                                        <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>{student.name.charAt(0)}</Text>
                                    </View>
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{student.name}</Text>
                                        <Text style={styles.studentGrade}>{student.grade || 'No Grade'}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const StatBox = ({ icon, count, label, color }: any) => (
    <View style={styles.statBox}>
        <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
            {React.cloneElement(icon, { size: 20, color: color })}
        </View>
        <Text style={styles.statCount}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.background },
    safeArea: { flex: 1 },
    container: { flex: 1, padding: SIZES.l },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.l, marginTop: Platform.OS === 'android' ? 40 : 0 },
    greeting: { fontSize: 14, color: COLORS.textSecondary },
    username: { fontSize: 24, fontWeight: '700', color: COLORS.text },
    iconButton: { padding: SIZES.s, backgroundColor: COLORS.surface, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border },
    codeCard: { padding: SIZES.l, borderRadius: SIZES.radiusL, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.l, ...SHADOWS.glow },
    codeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
    codeValue: { color: COLORS.white, fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
    copyButton: { width: 40, height: 40, backgroundColor: COLORS.white, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.m, marginBottom: SIZES.xl },
    statBox: { width: '47%', backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    statIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.s },
    statCount: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    statLabel: { fontSize: 12, color: COLORS.textSecondary },
    analyticsButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.m, borderRadius: SIZES.radius, marginBottom: SIZES.l, gap: 8 },
    analyticsButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.m },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    addButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 4, fontSize: 12 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SIZES.m, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.m, height: 48 },
    searchIcon: { marginRight: SIZES.s },
    searchInput: { flex: 1, color: COLORS.text },
    studentList: { marginBottom: SIZES.xl },
    emptyText: { color: COLORS.textMuted, textAlign: 'center', fontStyle: 'italic' },
    studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radius, marginBottom: SIZES.s, borderWidth: 1, borderColor: COLORS.border },
    studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.m },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    studentGrade: { fontSize: 12, color: COLORS.textSecondary },
    actionButton: { padding: SIZES.s },
    quickActions: { marginBottom: SIZES.xl },
    quickActionCard: { backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radius, marginRight: SIZES.m, alignItems: 'center', width: 100, borderWidth: 1, borderColor: COLORS.border },
    quickActionIcon: { marginBottom: SIZES.s },
    quickActionLabel: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
});
