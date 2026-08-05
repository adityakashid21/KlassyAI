import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import {
    CalendarCheck, DollarSign, Award, Link as LinkIcon,
    Bell, BookOpen, Settings, Users
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const TOOLS = [
    { id: 'Attendance', label: 'Attendance', icon: <CalendarCheck size={28} color={COLORS.white} />, color: COLORS.primary, route: 'Attendance' },
    { id: 'Fees', label: 'Fees & Payments', icon: <DollarSign size={28} color={COLORS.white} />, color: COLORS.success, route: 'Fees' },
    { id: 'Marks', label: 'Marks & Results', icon: <Award size={28} color={COLORS.white} />, color: COLORS.warning, route: 'Marks' }, // Upcoming
    { id: 'Materials', label: 'Study Materials', icon: <LinkIcon size={28} color={COLORS.white} />, color: COLORS.accent, route: 'Materials' }, // Upcoming
    { id: 'Notices', label: 'Notices Board', icon: <Bell size={28} color={COLORS.white} />, color: '#8B5CF6', route: 'Notices' }, // Upcoming
    { id: 'Syllabus', label: 'Syllabus', icon: <BookOpen size={28} color={COLORS.white} />, color: '#EC4899', route: 'Syllabus' }, // Upcoming
];

export default function ToolsScreen() {
    const navigation = useNavigation<any>();

    const renderTool = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => item.route && navigation.navigate(item.route)}
        >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                {item.icon}
            </View>
            <Text style={styles.cardLabel}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Classroom Tools</Text>
                    <Text style={styles.subTitle}>Manage everything in one place</Text>
                </View>

                <FlatList
                    data={TOOLS}
                    renderItem={renderTool}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingHorizontal: SIZES.l,
        paddingBottom: SIZES.l,
        paddingTop: Platform.OS === 'android' ? 40 : SIZES.xl
    },
    pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    subTitle: { fontSize: 14, color: COLORS.textSecondary },
    grid: { padding: SIZES.l },
    card: {
        width: '48%',
        backgroundColor: COLORS.surface,
        padding: SIZES.l,
        borderRadius: SIZES.radiusL,
        marginBottom: SIZES.m,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.m,
        ...SHADOWS.glow
    },
    cardLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' }
});
