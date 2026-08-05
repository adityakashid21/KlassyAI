import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Award, TrendingUp, BookOpen } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CacheManager } from '../../services/cache';

export default function StudentMarksScreen({ navigation }: any) {
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ average: 0, highest: 0, total: 0 });

    useEffect(() => {
        fetchMarks();
    }, []);

    const fetchMarks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single();
            if (!student) return;

            // Try cache first
            const cached = await CacheManager.getMarks(student.id);
            if (cached && !refreshing) {
                processMarksData(cached);
                setLoading(false);
                return;
            }

            // Fetch from database
            const { data } = await supabase
                .from('marks')
                .select('*')
                .eq('student_id', student.id)
                .order('created_at', { ascending: false });

            if (data) {
                await CacheManager.cacheMarks(student.id, data);
                processMarksData(data);
            }
        } catch (error) {
            __DEV__ && console.log('Error fetching marks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processMarksData = (data: any[]) => {
        setMarks(data);

        if (data.length > 0) {
            const percentages = data.map(m => (m.score / m.max_score) * 100);
            const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
            const highest = Math.max(...percentages);

            setStats({
                average: Math.round(avg),
                highest: Math.round(highest),
                total: data.length
            });
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMarks();
    }, []);

    const renderItem = ({ item }: { item: any }) => {
        const percentage = ((item.score / item.max_score) * 100).toFixed(1);
        const color = parseFloat(percentage) >= 75 ? COLORS.success :
            parseFloat(percentage) >= 50 ? COLORS.warning : COLORS.error;

        return (
            <View style={styles.markCard}>
                <View style={styles.markHeader}>
                    <View>
                        <Text style={styles.examName}>{item.exam_name || 'Test'}</Text>
                        <Text style={styles.subject}>{item.subject}</Text>
                    </View>
                    <View style={[styles.percentageChip, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
                    </View>
                </View>
                <View style={styles.scoreRow}>
                    <Text style={styles.scoreText}>
                        Score: <Text style={styles.scoreValue}>{item.score}/{item.max_score}</Text>
                    </Text>
                    {item.exam_date && (
                        <Text style={styles.dateText}>
                            {new Date(item.exam_date).toLocaleDateString()}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <BookOpen size={60} color={COLORS.primary} opacity={0.3} />
            <Text style={styles.emptyTitle}>No Marks Yet</Text>
            <Text style={styles.emptySubtitle}>Your test scores will appear here</Text>
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
                    <Text style={styles.title}>My Marks</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={marks}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            marks.length > 0 ? (
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>Performance Overview</Text>
                                    <View style={styles.statsRow}>
                                        <View style={styles.statBox}>
                                            <TrendingUp size={20} color={COLORS.primary} />
                                            <Text style={styles.statValue}>{stats.average}%</Text>
                                            <Text style={styles.statLabel}>Average</Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.statBox}>
                                            <Award size={20} color={COLORS.success} />
                                            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.highest}%</Text>
                                            <Text style={styles.statLabel}>Best</Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.statBox}>
                                            <BookOpen size={20} color={COLORS.accent} />
                                            <Text style={styles.statValue}>{stats.total}</Text>
                                            <Text style={styles.statLabel}>Tests</Text>
                                        </View>
                                    </View>
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
    summaryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusL,
        padding: SIZES.l,
        marginBottom: SIZES.l,
        ...SHADOWS.medium
    },
    summaryTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: SIZES.m },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
    statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    divider: { width: 1, height: 40, backgroundColor: COLORS.border },
    markCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusM,
        padding: SIZES.m,
        marginBottom: SIZES.s,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    markHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.s },
    examName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    subject: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
    percentageChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    percentageText: { fontSize: 14, fontWeight: 'bold' },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreText: { fontSize: 14, color: COLORS.textSecondary },
    scoreValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    dateText: { fontSize: 12, color: COLORS.textMuted },
    emptyContainer: { alignItems: 'center', padding: 40, marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
