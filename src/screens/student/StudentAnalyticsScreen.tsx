import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { ArrowLeft, TrendingUp, BookOpen, Clock, Activity } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`, // primary color
    labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    propsForDots: {
        r: "5",
        strokeWidth: "2",
        stroke: COLORS.surface
    }
};

const attendanceChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Success green
};

export default function StudentAnalyticsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Data states
    const [marksGrowthData, setMarksGrowthData] = useState({ labels: [''], datasets: [{ data: [0] }] });
    const [subjectData, setSubjectData] = useState({ labels: [''], datasets: [{ data: [0] }] });
    const [attendanceData, setAttendanceData] = useState({ labels: ['Attendance'], data: [0] });
    
    const [stats, setStats] = useState({ overallAvg: 0, attendancePercent: 0, bestSubject: '-' });

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single();
            if (!student) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Fetch Data in parallel
            const [marksRes, attendanceRes] = await Promise.all([
                supabase.from('marks').select('*').eq('student_id', student.id).order('created_at', { ascending: true }),
                supabase.from('attendance').select('*').eq('student_id', student.id)
            ]);

            processMarksData(marksRes.data || []);
            processAttendanceData(attendanceRes.data || []);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processMarksData = (marks: any[]) => {
        // Growth over time (average per exam date)
        const exams: { [key: string]: { totalPercent: number, count: number } } = {};
        // Subject strengths
        const subjects: { [key: string]: { totalPercent: number, count: number } } = {};
        
        let sumPers = 0;
        let countPers = 0;

        marks.forEach(mark => {
            const dateStr = new Date(mark.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const percentage = (mark.score / mark.max_score) * 100;
            
            // For Growth Line Chart
            if (!exams[dateStr]) exams[dateStr] = { totalPercent: 0, count: 0 };
            exams[dateStr].totalPercent += percentage;
            exams[dateStr].count++;

            // For Subject Bar Chart
            if (!subjects[mark.subject]) subjects[mark.subject] = { totalPercent: 0, count: 0 };
            subjects[mark.subject].totalPercent += percentage;
            subjects[mark.subject].count++;

            sumPers += percentage;
            countPers++;
        });

        // Line Chart prep
        const examLabels = Object.keys(exams).slice(-6); // last 6 exams
        const examAvgData = examLabels.map(label => exams[label].totalPercent / exams[label].count);

        if (examLabels.length === 0) {
            examLabels.push('N/A');
            examAvgData.push(0);
        }

        setMarksGrowthData({ labels: examLabels, datasets: [{ data: examAvgData }] });

        // Bar Chart prep
        const subLabels: string[] = [];
        const subAvgData: number[] = [];
        let bestSub = '-';
        let highest = -1;

        Object.keys(subjects).forEach(sub => {
            const avg = subjects[sub].totalPercent / subjects[sub].count;
            subLabels.push(sub.substring(0, 5));
            subAvgData.push(avg);

            if (avg > highest) {
                highest = avg;
                bestSub = sub;
            }
        });

        if (subLabels.length === 0) {
            subLabels.push('N/A');
            subAvgData.push(0);
        }

        setSubjectData({ labels: subLabels, datasets: [{ data: subAvgData }] });

        const overallAvg = countPers > 0 ? sumPers / countPers : 0;
        setStats(prev => ({ ...prev, overallAvg: Math.round(overallAvg), bestSubject: bestSub }));
    };

    const processAttendanceData = (attendance: any[]) => {
        let present = 0;
        let total = attendance.length;

        attendance.forEach(record => {
            if (record.status === 'present' || record.status === 'late') present++;
        });

        let percentage = total > 0 ? present / total : 0;
        
        setAttendanceData({ labels: ['Attendance'], data: [percentage] }); // Needs decimal 0 to 1
        setStats(prev => ({ ...prev, attendancePercent: Math.round(percentage * 100) }));
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAnalyticsData();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Analytics</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    {/* Stats Highlights */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBadge, { backgroundColor: COLORS.primary + '20' }]}>
                                <Activity size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.statLabel}>Overall Average</Text>
                            <Text style={styles.statValue}>{stats.overallAvg}%</Text>
                        </View>
                        
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBadge, { backgroundColor: COLORS.success + '20' }]}>
                                <Clock size={20} color={COLORS.success} />
                            </View>
                            <Text style={styles.statLabel}>Attendance</Text>
                            <Text style={styles.statValue}>{stats.attendancePercent}%</Text>
                        </View>
                    </View>

                    {/* Progress Ring (Attendance) */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Clock size={20} color={COLORS.success} />
                            <Text style={styles.chartTitle}>Attendance Overview</Text>
                        </View>
                        <ProgressChart
                            data={attendanceData}
                            width={screenWidth - SIZES.l * 2 - SIZES.m * 2}
                            height={160}
                            strokeWidth={16}
                            radius={48}
                            chartConfig={attendanceChartConfig}
                            hideLegend={true}
                            style={styles.chartStyle}
                        />
                        <View style={{position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center'}}>
                             <Text style={{color: COLORS.text, fontSize: 24, fontWeight: 'bold'}}>{stats.attendancePercent}%</Text>
                        </View>
                    </View>

                    {/* Marks Growth Line Chart */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <TrendingUp size={20} color={COLORS.primary} />
                            <Text style={styles.chartTitle}>Marks Growth (Recent Exams)</Text>
                        </View>
                        <LineChart
                            data={marksGrowthData}
                            width={screenWidth - SIZES.l * 2 - SIZES.m * 2}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chartStyle}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            segments={4}
                            fromZero={true}
                        />
                    </View>

                    {/* Subject Strengths Bar Chart */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <BookOpen size={20} color={COLORS.warning} />
                            <Text style={styles.chartTitle}>Subject Strengths</Text>
                        </View>
                        <BarChart
                            data={subjectData}
                            width={screenWidth - SIZES.l * 2 - SIZES.m * 2}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            chartConfig={chartConfig}
                            style={styles.chartStyle}
                            showValuesOnTopOfBars={true}
                            fromZero={true}
                        />
                        <Text style={styles.chartSubtitle}>Strongest Subject: <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{stats.bestSubject}</Text></Text>
                    </View>
                    
                    <View style={{height: 40}} />
                </ScrollView>
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
        paddingTop: SIZES.l
    },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    scrollContent: { padding: SIZES.m },
    
    statsContainer: {
        flexDirection: 'row',
        gap: SIZES.m,
        marginBottom: SIZES.l
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusL,
        padding: SIZES.l,
        ...SHADOWS.card,
        alignItems: 'center'
    },
    statIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.m
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text
    },

    chartCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusL,
        padding: SIZES.l,
        marginBottom: SIZES.l,
        ...SHADOWS.card,
        position: 'relative'
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SIZES.l
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text
    },
    chartSubtitle: {
        marginTop: SIZES.m,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center'
    },
    chartStyle: {
        borderRadius: SIZES.radius,
        alignSelf: 'center'
    }
});
