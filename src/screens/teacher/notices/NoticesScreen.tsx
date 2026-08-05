import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Platform
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Bell, Trash2, X, Calendar } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function NoticesScreen({ navigation }: any) {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
            if (teacher) {
                setTeacherId(teacher.id);
                const { data } = await supabase
                    .from('notices')
                    .select('*')
                    .eq('teacher_id', teacher.id)
                    .order('created_at', { ascending: false });
                setNotices(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNotice = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert("Error", "Please enter title and content");
            return;
        }

        setSaving(true);
        const { error } = await supabase.from('notices').insert({
            teacher_id: teacherId,
            title: title,
            content: content
        });

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            setModalVisible(false);
            setTitle('');
            setContent('');
            fetchNotices();
            Alert.alert("Success", "Notice Posted!");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Notice", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: 'destructive', onPress: async () => {
                    await supabase.from('notices').delete().eq('id', id);
                    fetchNotices();
                }
            }
        ]);
    };

    const renderNotice = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBg}>
                    <Bell size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.dateRow}>
                        <Calendar size={12} color={COLORS.textSecondary} />
                        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Trash2 size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>
            <Text style={styles.content}>{item.content}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Notice Board</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Plus color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={notices}
                        renderItem={renderNotice}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No notices posted yet.</Text>}
                    />
                )}

                {/* Add Modal */}
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Post New Notice</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <X size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Exam Schedule"
                                placeholderTextColor={COLORS.textMuted}
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text style={styles.label}>Content</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Type your notice here..."
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                            />

                            <TouchableOpacity style={styles.postBtn} onPress={handleAddNotice} disabled={saving}>
                                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.postBtnText}>Post Notice</Text>}
                            </TouchableOpacity>
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
    card: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.m, marginBottom: SIZES.m, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.s },
    iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(34, 197, 94, 0.1)', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 12, color: COLORS.textSecondary },
    content: { color: COLORS.textSecondary, lineHeight: 20 },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusL, borderTopRightRadius: SIZES.radiusL, padding: SIZES.l, minHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.l },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    label: { color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: SIZES.m, color: COLORS.text, marginBottom: SIZES.l, borderWidth: 1, borderColor: COLORS.border },
    textArea: { height: 120 },
    postBtn: { backgroundColor: COLORS.primary, padding: SIZES.m, borderRadius: SIZES.radius, alignItems: 'center' },
    postBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});
