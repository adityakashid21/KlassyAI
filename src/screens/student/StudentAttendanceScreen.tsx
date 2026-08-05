import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Calendar } from 'react-native-calendars';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableOpacity } from 'react-native';
import { CacheManager } from '../../services/cache';

export default function StudentAttendanceScreen({ navigation }: any) {
    const [markedDates, setMarkedDates] = useState<any>({});
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single();
            if (!student) return;

            // Try cache first
            const cached = await CacheManager.getAttendance(student.id);
            if (cached && !refreshing) {
                processAttendanceData(cached);
                setLoading(false);
                return;
            }

            // Fetch from database
            const { data } = await supabase
                .from('attendance')
                .select('date, status')
                .eq('student_id', student.id)
                .order('date', { ascending: false });

            if (data) {
                await CacheManager.cacheAttendance(student.id, data);
                processAttendanceData(data);
            }
        } catch (error) {
            __DEV__ && console.log('Error fetching attendance:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processAttendanceData = (data: any[]) => {
        const marks: any = {};
        let p = 0, a = 0, l = 0;

        data.forEach((record: any) => {
            let color = COLORS.textSecondary;
            const status = record.status ? record.status.toLowerCase() : '';

            if (status === 'present') { color = COLORS.success; p++; }
            else if (status === 'absent') { color = COLORS.error; a++; }
            else if (status === 'late') { color = COLORS.warning; l++; }

            marks[record.date] = {
                customStyles: {
                    container: { backgroundColor: color },
                    text: { color: COLORS.white, fontWeight: 'bold' }
                }
            };
        });

        setMarkedDates(marks);
        setStats({ present: p, absent: a, late: l, total: data.length });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAttendance();
    }, []);

    const attendancePercentage = stats.total > 0 ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1) : '0';

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Attendance</Text>
                    <View style={{ width: 24 }}></View>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Loading...</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.content}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[COLORS.primary]}
                                tintColor={COLORS.primary}
                            />
                        }
                    >
                        <View style={styles.summaryCard}>
                            <View style={{ alignItems: 'center', marginBottom: SIZES.m }}>
                                <Text style={styles.percentage}>{attendancePercentage}%</Text>
                                <Text style={styles.label}>Overall Attendance</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <CheckCircle size={20} color={COLORS.success} />
                                    <Text style={styles.statValue}>{stats.present}</Text>
                                    <Text style={styles.statLabel}>Present</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <XCircle size={20} color={COLORS.error} />
                                    <Text style={styles.statValue}>{stats.absent}</Text>
                                    <Text style={styles.statLabel}>Absent</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Clock size={20} color={COLORS.warning} />
                                    <Text style={styles.statValue}>{stats.late}</Text>
                                    <Text style={styles.statLabel}>Late</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.calendarContainer}>
                            <Calendar
                                markingType={'custom'}
                                markedDates={markedDates}
                                theme={{
                                    backgroundColor: 'transparent',
                                    calendarBackground: 'transparent',
                                    textSectionTitleColor: COLORS.textSecondary,
                                    dayTextColor: COLORS.text,
                                    todayTextColor: COLORS.accent,
                                    monthTextColor: COLORS.primary,
                                    arrowColor: COLORS.primary,
                                    textMonthFontWeight: 'bold',
                                }}
                            />
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.m },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    content: { padding: SIZES.m },
    summaryCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusL, padding: SIZES.l, marginBottom: SIZES.l },
    percentage: { fontSize: 48, fontWeight: 'bold', color: COLORS.primary },
    label: { color: COLORS.textSecondary, fontSize: 14 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SIZES.m, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SIZES.m },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
    statLabel: { fontSize: 12, color: COLORS.textSecondary },
    calendarContainer: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusL, padding: 8, borderWidth: 1, borderColor: COLORS.border }
});
