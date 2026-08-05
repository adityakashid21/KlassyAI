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
    Linking,
    Platform
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Link as LinkIcon, Trash2, FileText, ExternalLink } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function MaterialsScreen({ navigation }: any) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
            if (teacher) {
                setTeacherId(teacher.id);
                fetchMaterials(teacher.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async (tId: string) => {
        const { data } = await supabase
            .from('study_materials')
            .select('*')
            .eq('teacher_id', tId)
            .order('created_at', { ascending: false });
        setMaterials(data || []);
    };

    const handleSave = async () => {
        if (!title || !url) {
            Alert.alert("Error", "Title and URL are required");
            return;
        }

        setSaving(true);
        setSaving(true);
        const { error } = await supabase.from('study_materials').insert({
            teacher_id: teacherId,
            topic_name: description ? `${title} - ${description}` : title,
            drive_link: url
        });

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            setModalVisible(false);
            setTitle('');
            setDescription('');
            setUrl('');
            Alert.alert("Success", "Material added successfully");
            if (teacherId) fetchMaterials(teacherId);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Confirm Delete", "Are you sure you want to delete this material?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    const { error } = await supabase.from('study_materials').delete().eq('id', id);
                    if (!error && teacherId) fetchMaterials(teacherId);
                }
            }
        ]);
    };

    const openLink = (link: string) => {
        Linking.openURL(link).catch(err => Alert.alert("Error", "Could not open link"));
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} onPress={() => openLink(item.drive_link)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
                <FileText color={COLORS.primary} size={24} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.topic_name}</Text>
                {/* Description is now part of topic_name */}
                <View style={styles.linkRow}>
                    <LinkIcon size={12} color={COLORS.info} />
                    <Text style={styles.linkText} numberOfLines={1}>{item.drive_link}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Trash2 size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Study Materials</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Plus color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={materials}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No materials uploaded yet.</Text>}
                    />
                )}

                {/* Add Modal */}
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add New Material</Text>

                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Chapter 1 Notes"
                                placeholderTextColor={COLORS.textMuted}
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Short description..."
                                placeholderTextColor={COLORS.textMuted}
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Text style={styles.label}>Link / URL</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://drive.google.com/..."
                                placeholderTextColor={COLORS.textMuted}
                                value={url}
                                onChangeText={setUrl}
                                autoCapitalize="none"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.btnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
                                    {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Upload</Text>}
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
    iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.m, borderWidth: 1, borderColor: COLORS.border },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    cardDesc: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    linkText: { color: COLORS.info, fontSize: 12, textDecorationLine: 'underline' },
    deleteBtn: { padding: 8, marginLeft: 8 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SIZES.m },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusL, padding: SIZES.l, borderWidth: 1, borderColor: COLORS.white + '10' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.m },
    label: { color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: SIZES.m, color: COLORS.text, marginBottom: SIZES.l, borderWidth: 1, borderColor: COLORS.border },
    modalActions: { flexDirection: 'row', gap: SIZES.m },
    btn: { flex: 1, padding: SIZES.m, borderRadius: SIZES.radius, alignItems: 'center' },
    btnCancel: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
    btnPrimary: { backgroundColor: COLORS.primary },
    btnText: { color: COLORS.white, fontWeight: '600' }
});
