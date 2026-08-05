import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Award, User, X, Check } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function MarksScreen({ navigation }: any) {
    const [marksList, setMarksList] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    // Add Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [examName, setExamName] = useState('');
    const [subject, setSubject] = useState('');
    const [obtained, setObtained] = useState('');
    const [total, setTotal] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Teacher
            const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
            if (teacher) {
                setTeacherId(teacher.id);

                // Get Students
                const { data: studentsData } = await supabase.from('students').select('*').eq('teacher_id', teacher.id).order('name');
                setStudents(studentsData || []);

                // Get Marks
                fetchMarks(teacher.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarks = async (tId: string) => {
        // Filter marks by students belonging to this teacher
        const { data } = await supabase
            .from('marks')
            .select('*, students!inner(name, teacher_id)')
            .eq('students.teacher_id', tId)
            .order('created_at', { ascending: false });
        setMarksList(data || []);
    };

    const handleSave = async () => {
        if (!selectedStudent || !examName || !subject || !obtained || !total) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        setSaving(true);
        const { error } = await supabase.from('marks').insert({
            student_id: selectedStudent,
            // teacher_id is not in marks table, relationship is via student
            exam_name: examName,
            subject: subject,
            score: parseFloat(obtained),
            max_score: parseFloat(total)
        });

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Success", "Marks recorded!");
            setModalVisible(false);
            // Reset Form - considering strictly controlled components, resetting state is enough
            setExamName('');
            setSubject('');
            setObtained('');
            setTotal('');
            if (teacherId) fetchMarks(teacherId);
        }
        setSaving(false);
    };

    const renderItem = ({ item }: { item: any }) => {
        // Fallback for fields
        const score = item.score ?? item.marks_obtained ?? 0;
        const max = item.max_score ?? item.total_marks ?? 100;
        const percentage = Math.round((score / max) * 100);

        let color = COLORS.primary;
        if (percentage >= 80) color = COLORS.success;
        else if (percentage < 40) color = COLORS.error;
        else if (percentage < 60) color = COLORS.warning;

        return (
            <View style={styles.card}>
                <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.scoreText, { color: color }]}>{percentage}%</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.studentName}>{item.students?.name}</Text>
                    <Text style={styles.examTitle}>{item.subject}</Text>
                    <Text style={styles.marksDetail}>{score} / {max}</Text>
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
                    <Text style={styles.title}>Marks & Results</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Plus color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={marksList}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No marks recorded yet.</Text>}
                    />
                )}

                {/* Add Results Modal */}
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Result</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <X size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Select Student</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search Student..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={studentSearch}
                                    onChangeText={setStudentSearch}
                                />
                                <ScrollView style={{ maxHeight: 150, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius }} nestedScrollEnabled={true}>
                                    {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={{
                                                padding: 12,
                                                borderBottomWidth: 1,
                                                borderBottomColor: COLORS.border,
                                                backgroundColor: selectedStudent === s.id ? COLORS.primary + '20' : 'transparent',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                            onPress={() => setSelectedStudent(s.id)}
                                        >
                                            <Text style={{ color: COLORS.text, fontWeight: selectedStudent === s.id ? 'bold' : 'normal' }}>{s.name}</Text>
                                            {selectedStudent === s.id && <Check size={16} color={COLORS.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.label}>Exam Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Midterm, Unit Test 1"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={examName}
                                    onChangeText={setExamName}
                                />

                                <Text style={styles.label}>Subject</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Mathematics"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={subject}
                                    onChangeText={setSubject}
                                />

                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Obtained</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={obtained}
                                            onChangeText={setObtained}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Total</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="100"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={total}
                                            onChangeText={setTotal}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                    {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Result</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.m,
        paddingBottom: SIZES.m,
        paddingTop: Platform.OS === 'android' ? 40 : SIZES.l
    },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow },
    list: { padding: SIZES.m },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SIZES.m,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card
    },
    scoreBadge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.m },
    scoreText: { fontWeight: 'bold', fontSize: 13 },
    cardContent: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    examTitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 },
    marksDetail: { color: COLORS.text, fontWeight: '600', fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: SIZES.radiusL,
        borderTopRightRadius: SIZES.radiusL,
        padding: SIZES.l,
        maxHeight: '85%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.l },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    label: { color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: SIZES.m, color: COLORS.text, marginBottom: SIZES.l, borderWidth: 1, borderColor: COLORS.border },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { color: COLORS.textSecondary },
    chipTextActive: { color: COLORS.white, fontWeight: 'bold' },
    saveBtn: { backgroundColor: COLORS.primary, padding: SIZES.m, borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.s },
    saveBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});
