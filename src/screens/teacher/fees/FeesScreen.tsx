import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    TextInput,
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    Platform
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, DollarSign, FileText, Download, X, Check } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNPrint from 'react-native-print';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function FeesScreen({ navigation }: any) {
    const [fees, setFees] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState<any>(null);

    // Modals
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [payModalVisible, setPayModalVisible] = useState(false);

    // States for Adding Fee
    const [selectedStudent, setSelectedStudent] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);

    // States for Updating Payment
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [payAmount, setPayAmount] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: teacherData } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
            setTeacher(teacherData);

            if (teacherData) {
                const { data: studentsData } = await supabase.from('students').select('*').eq('teacher_id', teacherData.id);
                setStudents(studentsData || []);

                fetchFees(studentsData || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchFees = async (currentStudents: any[]) => {
        if (!currentStudents || !Array.isArray(currentStudents) || currentStudents.length === 0) {
            setFees([]);
            return;
        }

        const studentIds = currentStudents.map(s => s.id);

        const { data, error } = await supabase
            .from('fees')
            .select(`
            *,
            students (name)
        `)
            .in('student_id', studentIds)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setFees(data);
        }
    };

    const handleAddFee = async () => {
        if (!selectedStudent || !amount) {
            Alert.alert("Error", "Please select student and amount");
            return;
        }

        const { error } = await supabase.from('fees').insert({
            student_id: selectedStudent,
            amount: parseFloat(amount),
            paid_amount: 0,
            month: month,
            year: new Date().getFullYear(),
            status: 'pending'
        });

        if (error) Alert.alert("Error", error.message);
        else {
            Alert.alert("Success", "Fee Record Added");
            fetchFees(students);
        }
    };

    const handleUpdatePayment = async () => {
        if (!selectedFee || !payAmount) return;

        const newPaid = (selectedFee.paid_amount || 0) + parseFloat(payAmount);
        const newStatus = newPaid >= selectedFee.amount ? 'paid' : 'partial';

        const { error } = await supabase.from('fees').update({
            paid_amount: newPaid,
            status: newStatus,
            paid_date: new Date().toISOString()
        }).eq('id', selectedFee.id);

        if (error) Alert.alert("Error", error.message);
        else {
            Alert.alert("Success", "Payment Updated");
            fetchFees(students);
        }
    };

    const generateReceipt = async (fee: any) => {
        const balance = fee.amount - (fee.paid_amount || 0);
        const statusColor = balance <= 0 ? 'green' : 'red';
        const statusText = balance <= 0 ? 'PAID IN FULL' : 'PARTIAL / PENDING';

        const html = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, sans-serif; padding: 40px; }
              h1 { text-align: center; color: #333; }
              .header { text-align: center; margin-bottom: 40px; }
              .content { border: 1px solid #ccc; padding: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .label { font-weight: bold; }
              .status { text-align: center; font-size: 20px; margin-top: 20px; color: ${statusColor}; font-weight: bold; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="header">
                <h1>${teacher?.tuition_name || 'Tuition Receipt'}</h1>
                <p>${teacher?.address || ''}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
                <div class="row"><span class="label">Receipt ID:</span> <span>${fee.id.substring(0, 8).toUpperCase()}</span></div>
                <div class="row"><span class="label">Student:</span> <span>${fee.students?.name}</span></div>
                <div class="row"><span class="label">Month:</span> <span>${fee.month} ${fee.year}</span></div>
                <hr/>
                <div class="row"><span class="label">Total Fee:</span> <span>₹${fee.amount}</span></div>
                <div class="row"><span class="label">Amount Paid:</span> <span>₹${fee.paid_amount || 0}</span></div>
                <div class="row"><span class="label">Balance:</span> <span>₹${balance}</span></div>
                <div class="status">${statusText}</div>
            </div>
            <div class="footer">
                <p>Generated by KlassyAI</p>
                <p>Authorized Signature ________________</p>
            </div>
          </body>
        </html>
      `;

        try {
            await RNPrint.print({ html });
        } catch (error) {
            Alert.alert("Error", "Failed to clear print job");
        }
    };

    const renderFeeItem = ({ item }: { item: any }) => {
        const pending = item.amount - (item.paid_amount || 0);
        const isPaid = pending <= 0;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.students?.name}</Text>
                    <View style={[styles.badge, isPaid ? styles.badgeSuccess : styles.badgePending]}>
                        <Text style={styles.badgeText}>{isPaid ? 'PAID' : (item.paid_amount > 0 ? 'PARTIAL' : 'PENDING')}</Text>
                    </View>
                </View>

                <Text style={styles.monthText}>{item.month} {item.year}</Text>

                <View style={styles.amountRow}>
                    <View>
                        <Text style={styles.label}>Total</Text>
                        <Text style={styles.amount}>₹{item.amount}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Paid</Text>
                        <Text style={[styles.amount, { color: COLORS.success }]}>₹{item.paid_amount || 0}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Due</Text>
                        <Text style={[styles.amount, { color: COLORS.error }]}>₹{pending}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => generateReceipt(item)}>
                        <FileText size={18} color={COLORS.textSecondary} />
                        <Text style={styles.iconBtnText}>Receipt</Text>
                    </TouchableOpacity>

                    {!isPaid && (
                        <TouchableOpacity
                            style={styles.payBtn}
                            onPress={() => {
                                setSelectedFee(item);
                                setPayAmount(pending.toString());
                                setPayModalVisible(true);
                            }}
                        >
                            <DollarSign size={16} color={COLORS.white} />
                            <Text style={styles.payBtnText}>Record Payment</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Fees Records</Text>
                    <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addBtn}>
                        <Plus color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={fees}
                        renderItem={renderFeeItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                    />
                )}

                {/* Add Fee Modal */}
                <Modal visible={addModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add New Fee</Text>

                            <Text style={styles.inputLabel}>Select Student</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Search Student Name..."
                                placeholderTextColor={COLORS.textMuted}
                                value={studentSearch}
                                onChangeText={setStudentSearch}
                            />

                            <FlatList
                                data={students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))}
                                keyExtractor={item => item.id}
                                style={{ maxHeight: 150, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius }}
                                nestedScrollEnabled={true}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{
                                            padding: 12,
                                            borderBottomWidth: 1,
                                            borderBottomColor: COLORS.border,
                                            backgroundColor: selectedStudent === item.id ? COLORS.primary + '20' : 'transparent',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onPress={() => {
                                            setSelectedStudent(item.id);
                                        }}
                                    >
                                        <Text style={{ color: COLORS.text, fontWeight: selectedStudent === item.id ? 'bold' : 'normal' }}>
                                            {item.name}
                                        </Text>
                                        {selectedStudent === item.id && <Check size={16} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                )}
                            />

                            <Text style={styles.inputLabel}>Amount (₹)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                placeholder={teacher?.monthly_fee?.toString() || '0'}
                                placeholderTextColor={COLORS.textMuted}
                            />

                            <Text style={styles.inputLabel}>Month</Text>
                            <ScrollView horizontal style={{ maxHeight: 50, marginBottom: 20 }}>
                                {MONTHS.map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.chip, month === m && styles.chipActive]}
                                        onPress={() => setMonth(m)}
                                    >
                                        <Text style={[styles.chipText, month === m && styles.chipTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setAddModalVisible(false)}>
                                    <Text style={styles.btnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleAddFee}>
                                    <Text style={styles.btnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Pay Modal */}
                <Modal visible={payModalVisible} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: 'auto' }]}>
                            <Text style={styles.modalTitle}>Update Payment</Text>
                            <Text style={styles.modalSubtitle}>For {selectedFee?.students?.name} ({selectedFee?.month})</Text>

                            <Text style={styles.inputLabel}>Amount Receiving (₹)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={payAmount}
                                onChangeText={setPayAmount}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setPayModalVisible(false)}>
                                    <Text style={styles.btnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleUpdatePayment}>
                                    <Text style={styles.btnText}>Confirm</Text>
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
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SIZES.m,
        marginBottom: SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    monthText: { color: COLORS.textSecondary, marginBottom: SIZES.m, fontSize: 14 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
    badgePending: { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' },
    badgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.text },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SIZES.m,
        backgroundColor: COLORS.background,
        padding: SIZES.m,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    label: { fontSize: 12, color: COLORS.textSecondary },
    amount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.s },
    iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
    iconBtnText: { color: COLORS.textSecondary, fontSize: 14 },
    payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    payBtnText: { color: COLORS.white, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SIZES.m },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusL, padding: SIZES.l },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.m },
    modalSubtitle: { color: COLORS.textSecondary, marginBottom: SIZES.m },
    inputLabel: { color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: SIZES.m, color: COLORS.text, marginBottom: SIZES.l, borderWidth: 1, borderColor: COLORS.border },
    modalActions: { flexDirection: 'row', gap: SIZES.m, marginTop: SIZES.m },
    btn: { flex: 1, padding: SIZES.m, borderRadius: SIZES.radius, alignItems: 'center' },
    btnCancel: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
    btnPrimary: { backgroundColor: COLORS.primary },
    btnText: { color: COLORS.white, fontWeight: '600' },

    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { color: COLORS.textSecondary },
    chipTextActive: { color: COLORS.white, fontWeight: 'bold' }
});
