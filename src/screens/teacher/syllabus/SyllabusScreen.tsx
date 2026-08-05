import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SIZES } from '../../../constants/theme';
import { ArrowLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function SyllabusScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Syllabus</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.placeholderText}>Syllabus Management Coming Soon</Text>
                </View>
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
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: COLORS.textSecondary, fontSize: 16 }
});
