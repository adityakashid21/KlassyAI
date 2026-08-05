import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Alert,
    ScrollView,
    SafeAreaView,
    Platform
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Check, X, Clock, Calendar as CalendarIcon, Save } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function AttendanceScreen({ navigation }: any) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [selectedDate]); // Refetch when date changes

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Teacher ID
            const { data: teacher } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!teacher) return;
            setTeacherId(teacher.id);

            // 2. Get Students
            const { data: studentsData } = await supabase
                .from('students')
                .select('*')
                .eq('teacher_id', teacher.id)
                .order('name');

            setStudents(studentsData || []);

            // 3. Get Existing Attendance for Date
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('*')
                .eq('date', selectedDate)
                .in('student_id', (studentsData || []).map(s => s.id));

            // Map to state
            const attendanceMap: Record<string, string> = {};
            if (attendanceData) {
                attendanceData.forEach((record: any) => {
                    attendanceMap[record.student_id] = record.status;
                });
            }
            setAttendance(attendanceMap);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId: string, status: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const saveAttendance = async () => {
        if (Object.keys(attendance).length === 0) {
            Alert.alert("Warning", "Mark attendance for at least one student.");
            return;
        }

        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: studentId,
                date: selectedDate,
                status: status
            }));

            const { error } = await supabase
                .from('attendance')
                .upsert(records, { onConflict: 'student_id,date' });

            if (error) throw error;
            Alert.alert("Success", "Attendance saved successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const renderStudent = ({ item }: { item: any }) => {
        const status = attendance[item.id];
        return (
            <View style={styles.card}>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.grade}>{item.grade || 'No Grade'}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.statusBtn, status === 'present' && styles.presentActive]}
                        onPress={() => toggleStatus(item.id, 'present')}
                    >
                        <Check size={18} color={status === 'present' ? COLORS.white : COLORS.success} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusBtn, status === 'absent' && styles.absentActive]}
                        onPress={() => toggleStatus(item.id, 'absent')}
                    >
                        <X size={18} color={status === 'absent' ? COLORS.white : COLORS.error} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusBtn, status === 'late' && styles.lateActive]}
                        onPress={() => toggleStatus(item.id, 'late')}
                    >
                        <Clock size={18} color={status === 'late' ? COLORS.white : COLORS.warning} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Attendance</Text>
                    <TouchableOpacity onPress={saveAttendance} disabled={saving}>
                        {saving ? <ActivityIndicator color={COLORS.primary} /> : <Save color={COLORS.primary} size={24} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarContainer}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        theme={{
                            backgroundColor: 'transparent',
                            calendarBackground: 'transparent',
                            textSectionTitleColor: COLORS.textSecondary,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: COLORS.white,
                            todayTextColor: COLORS.accent,
                            dayTextColor: COLORS.text,
                            textDisabledColor: COLORS.surfaceLight,
                            arrowColor: COLORS.primary,
                            monthTextColor: COLORS.text,
                            textMonthFontWeight: 'bold',
                        }}
                        markedDates={{
                            [selectedDate]: { selected: true, disableTouchEvent: true }
                        }}
                    />
                </View>

                <FlatList
                    data={students}
                    renderItem={renderStudent}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.dateText}>Marking for: {selectedDate}</Text>
                            <Text style={styles.countText}>{students.length} Students</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.m, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: Platform.OS === 'android' ? 40 : SIZES.m },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    calendarContainer: { backgroundColor: COLORS.surface, margin: SIZES.m, borderRadius: SIZES.radius, padding: 4, borderWidth: 1, borderColor: COLORS.border },
    list: { paddingHorizontal: SIZES.m, paddingBottom: 100 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.m, marginTop: SIZES.s },
    dateText: { color: COLORS.text, fontWeight: '600' },
    countText: { color: COLORS.textSecondary },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.m, borderRadius: SIZES.radius, marginBottom: SIZES.s, borderWidth: 1, borderColor: COLORS.border },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    grade: { fontSize: 12, color: COLORS.textSecondary },
    actions: { flexDirection: 'row', gap: 8 },
    statusBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
    presentActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    absentActive: { backgroundColor: COLORS.error, borderColor: COLORS.error },
    lateActive: { backgroundColor: COLORS.warning, borderColor: COLORS.warning }
});
