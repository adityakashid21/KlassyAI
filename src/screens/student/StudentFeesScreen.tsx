import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle, Calendar, Download } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CacheManager } from '../../services/cache';
import { generateFeeReceipt } from '../../utils/pdfGenerator';

export default function StudentFeesScreen({ navigation }: any) {
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ paid: 0, pending: 0, total: 0 });
    const [studentData, setStudentData] = useState<any>(null);
    const [teacherData, setTeacherData] = useState<any>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
            if (!student) return;

            setStudentData(student);

            // Get teacher data
            const { data: teacher } = await supabase.from('teachers').select('*').eq('id', student.teacher_id).single();
            if (teacher) setTeacherData(teacher);

            const cached = await CacheManager.get(`fees_${student.id}`);
            if (cached && !refreshing) {
                processFeesData(cached);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('fees')
                .select('*')
                .eq('student_id', student.id)
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (data) {
                await CacheManager.set(`fees_${student.id}`, data, 24 * 60 * 60 * 1000);
                processFeesData(data);
            }
        } catch (error) {
            __DEV__ && console.log('Error fetching fees:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processFeesData = (data: any[]) => {
        setFees(data);
        const paid = data.filter(f => f.status === 'paid').length;
        const pending = data.filter(f => f.status === 'pending').length;
        setStats({ paid, pending, total: data.length });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFees();
    }, []);

    const downloadReceipt = async (feeItem: any) => {
        if (!studentData || !teacherData) return;

        setDownloading(feeItem.id);
        await generateFeeReceipt(feeItem, studentData, teacherData);
        setDownloading(null);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isPaid = item.status === 'paid';

        return (
            <View style={styles.feeCard}>
                <View style={styles.feeHeader}>
                    <View>
                        <Text style={styles.monthText}>{item.month} {item.year}</Text>
                        <Text style={styles.amountText}>₹{item.amount}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isPaid ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                        {isPaid ? (
                            <CheckCircle size={16} color={COLORS.success} />
                        ) : (
                            <AlertCircle size={16} color={COLORS.warning} />
                        )}
                        <Text style={[styles.statusText, { color: isPaid ? COLORS.success : COLORS.warning }]}>
                            {isPaid ? 'Paid' : 'Pending'}
                        </Text>
                    </View>
                </View>
                {isPaid && item.paid_date && (
                    <Text style={styles.paidDate}>
                        Paid on: {new Date(item.paid_date).toLocaleDateString()}
                    </Text>
                )}
                {isPaid && item.payment_mode && (
                    <Text style={styles.paymentMode}>
                        Mode: {item.payment_mode}
                    </Text>
                )}
                {isPaid && (
                    <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={() => downloadReceipt(item)}
                        disabled={downloading === item.id}
                    >
                        {downloading === item.id ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <>
                                <Download size={16} color={COLORS.white} />
                                <Text style={styles.downloadText}>Download Receipt</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <DollarSign size={60} color={COLORS.primary} opacity={0.3} />
            <Text style={styles.emptyTitle}>No Fee Records</Text>
            <Text style={styles.emptySubtitle}>Your fee information will appear here</Text>
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
                    <Text style={styles.title}>Fee Records</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={fees}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            fees.length > 0 ? (
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>Payment Summary</Text>
                                    <View style={styles.statsRow}>
                                        <View style={styles.statBox}>
                                            <CheckCircle size={20} color={COLORS.success} />
                                            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.paid}</Text>
                                            <Text style={styles.statLabel}>Paid</Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.statBox}>
                                            <AlertCircle size={20} color={COLORS.warning} />
                                            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.pending}</Text>
                                            <Text style={styles.statLabel}>Pending</Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.statBox}>
                                            <Calendar size={20} color={COLORS.primary} />
                                            <Text style={styles.statValue}>{stats.total}</Text>
                                            <Text style={styles.statLabel}>Total</Text>
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
        ...SHADOWS.card
    },
    summaryTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: SIZES.m },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
    statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    divider: { width: 1, height: 40, backgroundColor: COLORS.border },
    feeCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SIZES.m,
        marginBottom: SIZES.s,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    monthText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    amountText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4
    },
    statusText: { fontSize: 12, fontWeight: '600' },
    paidDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
    paymentMode: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8
    },
    downloadText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600'
    },
    emptyContainer: { alignItems: 'center', padding: 40, marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
