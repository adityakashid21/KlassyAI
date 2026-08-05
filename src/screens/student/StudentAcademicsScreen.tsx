import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Award, BookOpen, ArrowRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function StudentAcademicsScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>Academics</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Performance & Study</Text>

                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('StudentMarks')}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, '#4f80e1']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        >
                            <View style={styles.iconBox}>
                                <Award size={32} color={COLORS.white} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>Marks & Results</Text>
                                <Text style={styles.cardDesc}>View your exam scores and progress.</Text>
                            </View>
                            <ArrowRight color={COLORS.white} size={24} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('StudentMaterials')}
                    >
                        <LinearGradient
                            colors={[COLORS.accent, '#f59e0b']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        >
                            <View style={styles.iconBox}>
                                <BookOpen size={32} color={COLORS.white} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>Study Materials</Text>
                                <Text style={styles.cardDesc}>Access notes and resources.</Text>
                            </View>
                            <ArrowRight color={COLORS.white} size={24} />
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingHorizontal: SIZES.m,
        paddingBottom: SIZES.m,
        paddingTop: Platform.OS === 'android' ? 40 : SIZES.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '50'
    },
    title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
    content: { padding: SIZES.l },
    sectionTitle: { color: COLORS.textSecondary, marginBottom: SIZES.m, fontWeight: '600' },
    card: { marginBottom: SIZES.l, borderRadius: SIZES.radiusL, ...SHADOWS.card, elevation: 5 },
    cardGradient: { flexDirection: 'row', alignItems: 'center', padding: SIZES.l, borderRadius: SIZES.radiusL },
    iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: SIZES.m },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, marginBottom: 4 },
    cardDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13 }
});
