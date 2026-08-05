import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Bell, AlertCircle } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CacheManager } from '../../services/cache';

export default function StudentNoticesScreen({ navigation }: any) {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase.from('students').select('teacher_id').eq('user_id', user.id).single();
            if (!student) return;

            const cached = await CacheManager.get(`notices_${student.teacher_id}`);
            if (cached && !refreshing) {
                setNotices(cached);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('notices')
                .select('*')
                .eq('teacher_id', student.teacher_id)
                .order('created_at', { ascending: false });

            if (data) {
                await CacheManager.set(`notices_${student.teacher_id}`, data, 6 * 60 * 60 * 1000);
                setNotices(data);
            }
        } catch (error) {
            __DEV__ && console.log('Error fetching notices:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotices();
    }, []);

    const renderItem = ({ item }: { item: any }) => {
        const isNew = new Date(item.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

        return (
            <View style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                    <View style={styles.iconBadge}>
                        <Bell size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.noticeTitle}>{item.title}</Text>
                            {isNew && (
                                <View style={styles.newBadge}>
                                    <Text style={styles.newText}>New</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleString()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.noticeContent}>{item.content}</Text>
            </View>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Bell size={60} color={COLORS.primary} opacity={0.3} />
            <Text style={styles.emptyTitle}>No Notices</Text>
            <Text style={styles.emptySubtitle}>Important announcements will appear here</Text>
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
                    <Text style={styles.title}>Notices</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notices}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            notices.length > 0 ? (
                                <View style={styles.infoCard}>
                                    <AlertCircle size={18} color={COLORS.primary} />
                                    <Text style={styles.infoText}>
                                        Stay updated with important announcements
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
    infoText: { fontSize: 13, color: COLORS.text, flex: 1 },
    noticeCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusM,
        padding: SIZES.m,
        marginBottom: SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.small
    },
    noticeHeader: { flexDirection: 'row', marginBottom: SIZES.s, gap: 12 },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center'
    },
    noticeTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    dateText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    newBadge: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10
    },
    newText: { fontSize: 10, fontWeight: '600', color: COLORS.white },
    noticeContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
    emptyContainer: { alignItems: 'center', padding: 40, marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
