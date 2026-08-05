import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ArrowLeft, TrendingUp, DollarSign, Users, Award } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`, // primary color
    labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`, // secondary text
    strokeWidth: 3,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: COLORS.surface
    }
};

const revenueChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Success green
};

const attendanceChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Warning orange
};

export default function TeacherAnalyticsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Data states
    const [revenueData, setRevenueData] = useState({ labels: [''], datasets: [{ data: [0] }] });
    const [attendanceData, setAttendanceData] = useState({ labels: [''], datasets: [{ data: [0] }] });
    const [performanceData, setPerformanceData] = useState({ labels: [''], datasets: [{ data: [0] }] });
    const [stats, setStats] = useState({ totalRevenue: 0, avgAttendance: 0, topSubject: '-' });

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
            if (!teacher) return;

            const { data: students } = await supabase.from('students').select('id').eq('teacher_id', teacher.id);
            if (!students || students.length === 0) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const studentIds = students.map(s => s.id);

            // Fetch Data in parallel
            const [feesRes, attendanceRes, marksRes] = await Promise.all([
                supabase.from('fees').select('*').in('student_id', studentIds),
                supabase.from('attendance').select('*').in('student_id', studentIds),
                supabase.from('marks').select('*').in('student_id', studentIds)
            ]);

            processRevenueData(feesRes.data || []);
            processAttendanceData(attendanceRes.data || []);
            processPerformanceData(marksRes.data || []);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processRevenueData = (fees: any[]) => {
        // Group by month/year for the last 6 months
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyRevenue: { [key: string]: number } = {};
        
        let totalRevenueThisYear = 0;

        fees.forEach(fee => {
            if (fee.status === 'paid' || fee.paid_amount > 0) {
                const monthName = fee.month.substring(0, 3);
                // Simple grouping by month name
                monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + (fee.paid_amount || fee.amount);
                totalRevenueThisYear += (fee.paid_amount || fee.amount);
            }
        });

        // Get last 6 months ordered correctly
        const currentDate = new Date();
        const labels = [];
        const data = [];

        for (let i = 5; i >= 0; i--) {
            let d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            let monthLabel = months[d.getMonth()];
            labels.push(monthLabel);
            data.push(monthlyRevenue[monthLabel] || 0);
        }

        // If no data to show, give zeros
        const finalData = data.every(d => d === 0) ? [0,0,0,0,0,0] : data;

        setRevenueData({ labels, datasets: [{ data: finalData }] });
        setStats(prev => ({ ...prev, totalRevenue: totalRevenueThisYear }));
    };

    const processAttendanceData = (attendance: any[]) => {
        // Get last 7 days of attendance
        const dates: { [key: string]: { present: number, total: number } } = {};
        
        attendance.forEach(record => {
            const dateStr = record.date.split('T')[0];
            if (!dates[dateStr]) dates[dateStr] = { present: 0, total: 0 };
            dates[dateStr].total++;
            if (record.status === 'present' || record.status === 'late') dates[dateStr].present++;
        });

        // Sort dates
        const sortedDates = Object.keys(dates).sort().slice(-7); // Last 7 unique dates
        
        const labels: string[] = [];
        const data: number[] = [];
        let totalPresent = 0;
        let totalRecords = 0;

        sortedDates.forEach(date => {
            const day = new Date(date).getDate().toString();
            // Optional: format as Mon, Tue instead
            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            labels.push(dayName);
            
            const percentage = (dates[date].present / dates[date].total) * 100;
            data.push(percentage);
            
            totalPresent += dates[date].present;
            totalRecords += dates[date].total;
        });

        let avgAtt = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

        // Fallback
        if (labels.length === 0) {
            labels.push('N/A');
            data.push(0);
        }

        setAttendanceData({ labels, datasets: [{ data }] });
        setStats(prev => ({ ...prev, avgAttendance: Math.round(avgAtt) }));
    };

    const processPerformanceData = (marks: any[]) => {
        const subjects: { [key: string]: { totalPercentage: number, count: number } } = {};
        
        marks.forEach(mark => {
            if (!subjects[mark.subject]) subjects[mark.subject] = { totalPercentage: 0, count: 0 };
            
            const percentage = (mark.score / mark.max_score) * 100;
            subjects[mark.subject].totalPercentage += percentage;
            subjects[mark.subject].count++;
        });

        const labels: string[] = [];
        const data: number[] = [];
        let topSub = '-';
        let maxAvg = -1;

        Object.keys(subjects).forEach(sub => {
            const avg = subjects[sub].totalPercentage / subjects[sub].count;
            labels.push(sub.substring(0, 5)); // truncate long names
            data.push(avg);

            if (avg > maxAvg) {
                maxAvg = avg;
                topSub = sub;
            }
        });

        // Fallback
        if (labels.length === 0) {
            labels.push('N/A');
            data.push(0);
        }

        setPerformanceData({ labels, datasets: [{ data }] });
        setStats(prev => ({ ...prev, topSubject: topSub }));
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
                    <Text style={styles.title}>Analytics Overview</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    {/* Stats Highlights */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBadge, { backgroundColor: COLORS.success + '20' }]}>
                                <DollarSign size={20} color={COLORS.success} />
                            </View>
                            <Text style={styles.statLabel}>Total Revenue</Text>
                            <Text style={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
                        </View>
                        
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBadge, { backgroundColor: COLORS.warning + '20' }]}>
                                <Users size={20} color={COLORS.warning} />
                            </View>
                            <Text style={styles.statLabel}>Avg Attendance</Text>
                            <Text style={styles.statValue}>{stats.avgAttendance}%</Text>
                        </View>
                    </View>

                    {/* Revenue Line Chart */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <TrendingUp size={20} color={COLORS.success} />
                            <Text style={styles.chartTitle}>Revenue Growth (Last 6 Months)</Text>
                        </View>
                        <LineChart
                            data={revenueData}
                            width={screenWidth - SIZES.l * 2 - SIZES.m * 2} // padding adjustments
                            height={220}
                            chartConfig={revenueChartConfig}
                            bezier
                            style={styles.chartStyle}
                            yAxisLabel="₹"
                            segments={4}
                        />
                    </View>

                    {/* Performance Bar Chart */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Award size={20} color={COLORS.primary} />
                            <Text style={styles.chartTitle}>Class Average per Subject (%)</Text>
                        </View>
                        <BarChart
                            data={performanceData}
                            width={screenWidth - SIZES.l * 2 - SIZES.m * 2}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            chartConfig={chartConfig}
                            style={styles.chartStyle}
                            showValuesOnTopOfBars={true}
                            fromZero={true}
                        />
                        <Text style={styles.chartSubtitle}>Top Performing Subject: <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{stats.topSubject}</Text></Text>
                    </View>

                    {/* Attendance Line Chart */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Users size={20} color={COLORS.warning} />
                            <Text style={styles.chartTitle}>Attendance Trends (Last 7 Sessions)</Text>
                        </View>
                        <LineChart
                            data={attendanceData}
                            width={screenWidth - SIZES.l * 2 - SIZES.m * 2}
                            height={220}
                            chartConfig={attendanceChartConfig}
                            style={styles.chartStyle}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            fromZero={true}
                            segments={4}
                        />
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
        ...SHADOWS.card
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
