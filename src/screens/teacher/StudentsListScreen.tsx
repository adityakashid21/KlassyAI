import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    SafeAreaView,
    Alert,
    Platform,
    Modal
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Search, User, Phone, Mail, GraduationCap, Trash2, X, Save, Pencil } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function StudentsListScreen({ navigation }: any) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editGrade, setEditGrade] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (teacher) {
            const { data } = await supabase
                .from('students')
                .select('*')
                .eq('teacher_id', teacher.id)
                .order('name');
            setStudents(data || []);
        }
        setLoading(false);
    };

    const handleEdit = (student: any) => {
        setEditingStudent(student);
        setEditName(student.name);
        setEditGrade(student.grade || '');
        setEditPhone(student.phone || '');
        setEditModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        setSaving(true);
        const { error } = await supabase
            .from('students')
            .update({
                name: editName,
                grade: editGrade,
                phone: editPhone
            })
            .eq('id', editingStudent.id);

        if (error) {
            Alert.alert("Error", "Failed to update student");
        } else {
            Alert.alert("Success", "Student updated successfully");
            setEditModalVisible(false);
            fetchStudents();
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        Alert.alert("Delete Student", "Are you sure you want to remove this student? This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const id = editingStudent.id;
                    setSaving(true);

                    try {
                        // Manual Cascade Delete
                        await supabase.from('attendance').delete().eq('student_id', id);
                        await supabase.from('marks').delete().eq('student_id', id);
                        await supabase.from('fees').delete().eq('student_id', id);

                        // Finally delete student
                        const { error } = await supabase
                            .from('students')
                            .delete()
                            .eq('id', id);

                        if (error) throw error;

                        Alert.alert("Success", "Student removed successfully");
                        setEditModalVisible(false);

                        // Optimistic Update: Remove from local state immediately
                        setStudents(prev => prev.filter(s => s.id !== id));

                        // Refetch to be sure
                        fetchStudents();
                    } catch (error: any) {
                        Alert.alert("Error", "Failed to delete: " + error.message);
                    } finally {
                        setSaving(false);
                    }
                }
            }
        ]);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => handleEdit(item)}>
            <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.grade && (
                        <View style={styles.badge}>
                            <GraduationCap size={12} color={COLORS.textSecondary} />
                            <Text style={styles.badgeText}>{item.grade}</Text>
                        </View>
                    )}
                </View>
                <Pencil size={20} color={COLORS.textMuted} />
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                {item.email && (
                    <View style={styles.detailItem}>
                        <Mail size={14} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{item.email}</Text>
                    </View>
                )}
                {item.phone && (
                    <View style={styles.detailItem}>
                        <Phone size={14} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{item.phone}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Students</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert("Invite Students", "Share your Teacher Code with students to add them.")}>
                        <Plus color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or email..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filteredStudents}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No students found.</Text>
                            </View>
                        }
                    />
                )}

                {/* Edit Student Modal */}
                <Modal visible={editModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Edit Student</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <X size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Student Name"
                                placeholderTextColor={COLORS.textMuted}
                            />

                            <Text style={styles.label}>Grade / Class</Text>
                            <TextInput
                                style={styles.input}
                                value={editGrade}
                                onChangeText={setEditGrade}
                                placeholder="e.g. 10th - A"
                                placeholderTextColor={COLORS.textMuted}
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={editPhone}
                                onChangeText={setEditPhone}
                                placeholder="Phone Number"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="phone-pad"
                            />

                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                                    <Trash2 size={20} color={COLORS.white} />
                                    <Text style={styles.btnText}>Remove</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
                                    {saving ? <ActivityIndicator color={COLORS.white} /> : (
                                        <>
                                            <Save size={20} color={COLORS.white} />
                                            <Text style={styles.btnText}>Save Changes</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.m,
        paddingBottom: SIZES.m,
        paddingTop: Platform.OS === 'android' ? 40 : SIZES.l,
    },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow },
    searchContainer: {
        margin: SIZES.m,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.m,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 16 },
    list: { padding: SIZES.m },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SIZES.m,
        marginBottom: SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.m },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
    divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SIZES.m },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { marginLeft: 6, color: COLORS.textSecondary, fontSize: 13 },
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: COLORS.textMuted },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: SIZES.radiusL,
        borderTopRightRadius: SIZES.radiusL,
        padding: SIZES.l,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.l },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    label: { color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: SIZES.m, color: COLORS.text, marginBottom: SIZES.l, borderWidth: 1, borderColor: COLORS.border },
    actionButtons: { flexDirection: 'row', gap: SIZES.m, marginTop: SIZES.s, marginBottom: SIZES.m },
    deleteBtn: { flex: 1, backgroundColor: COLORS.error, padding: SIZES.m, borderRadius: SIZES.radius, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    saveBtn: { flex: 2, backgroundColor: COLORS.primary, padding: SIZES.m, borderRadius: SIZES.radius, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});
