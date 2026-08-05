import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileText, ExternalLink, BookOpen } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CacheManager } from '../../services/cache';

export default function StudentMaterialsScreen({ navigation }: any) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase.from('students').select('teacher_id').eq('user_id', user.id).single();
            if (!student) return;

            const cached = await CacheManager.get(`materials_${student.teacher_id}`);
            if (cached && !refreshing) {
                setMaterials(cached);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('study_materials')
                .select('*')
                .eq('teacher_id', student.teacher_id)
                .order('created_at', { ascending: false });

            if (data) {
                await CacheManager.set(`materials_${student.teacher_id}`, data, 24 * 60 * 60 * 1000);
                setMaterials(data);
            }
        } catch (error) {
            __DEV__ && console.log('Error fetching materials:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMaterials();
    }, []);

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => {
            __DEV__ && console.log('Error opening link:', err);
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.materialCard}
            onPress={() => openLink(item.drive_link)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <FileText size={24} color={COLORS.primary} />
            </View>
            <View style={styles.materialContent}>
                <Text style={styles.topicName}>{item.topic_name}</Text>
                <Text style={styles.dateText}>
                    Added {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <ExternalLink size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <BookOpen size={60} color={COLORS.primary} opacity={0.3} />
            <Text style={styles.emptyTitle}>No Study Materials</Text>
            <Text style={styles.emptySubtitle}>Your teacher will upload materials here</Text>
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
                    <Text style={styles.title}>Study Materials</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={materials}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            materials.length > 0 ? (
                                <View style={styles.infoCard}>
                                    <FileText size={20} color={COLORS.primary} />
                                    <Text style={styles.infoText}>
                                        {materials.length} {materials.length === 1 ? 'material' : 'materials'} available
                                    </Text>
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={<EmptyState />}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[COLORS.primary]}
                                tintColor={COLORS.primary}
                            />
                        }
                    />
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: COLORS.textSecondary, marginTop: 10 },
    listContent: { padding: SIZES.m },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        borderRadius: SIZES.radiusM,
        padding: SIZES.m,
        marginBottom: SIZES.m,
        gap: 12
    },
    infoText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
    materialCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusM,
        padding: SIZES.m,
        marginBottom: SIZES.s,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.small
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.m
    },
    materialContent: { flex: 1 },
    topicName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    dateText: { fontSize: 12, color: COLORS.textSecondary },
    emptyContainer: { alignItems: 'center', padding: 40, marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
