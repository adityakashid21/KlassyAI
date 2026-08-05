import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { generateContent, getCacheSize } from '../../services/ai';
import { ArrowLeft, Send, Brain, User, Bot } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AITutorScreen({ route }: any) {
    const navigation = useNavigation();
    const { studentName = 'Student' } = route.params || {};
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [cacheSize, setCacheSize] = useState(0);
    const [requestCount, setRequestCount] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const lastRequestTime = useRef<number>(0);


    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        // Debounce: Prevent rapid-fire requests
        const now = Date.now();
        if (now - lastRequestTime.current < 2000) {
            Alert.alert(
                'Too Fast!',
                'Please wait a moment before sending another message.',
                [{ text: 'OK' }]
            );
            return;
        }
        lastRequestTime.current = now;

        // Input length validation
        if (input.length > 500) {
            Alert.alert(
                'Message Too Long',
                'Please keep your question under 500 characters.',
                [{ text: 'OK' }]
            );
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Map format for service
            const history = messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }));

            const responseText = await generateContent(userMsg.content, history, studentName);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
            };

            setMessages((prev) => [...prev, aiMsg]);
            setRequestCount(prev => prev + 1);
            setCacheSize(getCacheSize());
        } catch (error: any) {
            const errorMessage = error.message || "I'm having trouble connecting right now. Please try again.";

            Alert.alert(
                'AI Connection Error',
                errorMessage,
                [{ text: 'OK' }]
            );

            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${errorMessage}`,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            setCacheSize(getCacheSize());
        }
    };


    useEffect(() => {
        // Load cache size on mount
        setCacheSize(getCacheSize());
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
        // Update cache size
        setCacheSize(getCacheSize());
    }, [messages]);

    const renderItem = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.aiRow
            ]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <LinearGradient colors={COLORS.gradients.accent} style={styles.avatar}>
                            <Bot size={16} color={COLORS.white} />
                        </LinearGradient>
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.aiBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userText : styles.aiText
                    ]}>{item.content}</Text>
                </View>

                {isUser && (
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: COLORS.surfaceLight }]}>
                            <User size={16} color={COLORS.text} />
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#0f1f26']} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft color={COLORS.text} size={24} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>AI Tutor</Text>
                            <Text style={styles.headerSubtitle}>Always here to help</Text>
                        </View>
                        <View style={styles.statsContainer}>
                            <Text style={styles.statText}>📞 {requestCount}</Text>
                            <Text style={styles.statText}>💾 {cacheSize}</Text>
                        </View>
                    </View>

                    {/* Chat Area */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Brain size={64} color={COLORS.primary} style={{ opacity: 0.5, marginBottom: SIZES.m }} />
                                <Text style={styles.emptyText}>Ask me anything about your studies!</Text>
                                <Text style={[styles.emptyText, { fontSize: 12, marginTop: SIZES.s }]}>
                                    💡 Responses are cached automatically for faster access
                                </Text>
                                {cacheSize > 0 && (
                                    <Text style={[styles.emptyText, { fontSize: 11, marginTop: SIZES.xs, opacity: 0.7 }]}>
                                        {cacheSize} questions already cached for instant answers!
                                    </Text>
                                )}
                            </View>
                        }
                    />

                    {/* Input Area */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask your question..."
                                placeholderTextColor={COLORS.textMuted}
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={500}
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                                onPress={sendMessage}
                                disabled={!input.trim() || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Send size={20} color={COLORS.white} />
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputHint}>
                            <Text style={styles.hintText}>
                                {input.length}/500 • Max 10 per minute
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: 'rgba(14, 21, 26, 0.8)'
    },
    backBtn: { marginRight: SIZES.m },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    headerSubtitle: { fontSize: 12, color: COLORS.textSecondary },
    listContent: { padding: SIZES.m, paddingBottom: SIZES.xl },
    messageRow: { flexDirection: 'row', marginBottom: SIZES.m, alignItems: 'flex-end', maxWidth: '100%' },
    userRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    aiRow: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
    avatarContainer: { marginHorizontal: 8 },
    avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    bubble: { padding: 12, borderRadius: 20, maxWidth: '75%' },
    userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: COLORS.white },
    aiText: { color: COLORS.text },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 },
    inputContainer: {
        flexDirection: 'row',
        padding: SIZES.m,
        backgroundColor: COLORS.surface,
        alignItems: 'flex-end'
    },
    inputWrapper: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.text,
        maxHeight: 100,
        marginRight: SIZES.s,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: COLORS.surfaceLight,
    },
    statsContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2,
    },
    statText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    inputHint: {
        paddingHorizontal: SIZES.m,
        paddingBottom: SIZES.s,
        backgroundColor: COLORS.surface,
    },
    hintText: {
        fontSize: 11,
        color: COLORS.textMuted,
        opacity: 0.7,
    }
});
