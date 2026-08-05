import AsyncStorage from '@react-native-async-storage/async-storage';

const MISTRAL_API_KEY = 'WnjDmbcjhutZlBvjPYhbtka3sUjHmL0X';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Cache configuration
const CACHE_VERSION = 'v1';
const CACHE_KEY = `ai-tutor-cache-${CACHE_VERSION}`;
const CACHE_EXPIRY_DAYS = 7;
const MAX_CACHE_SIZE = 200;

interface CachedResponse {
    answer: string;
    timestamp: number;
}

const responseCache = new Map<string, CachedResponse>();
let cacheLoaded = false;

// Load cache from storage
const loadCacheFromStorage = async (): Promise<void> => {
    if (cacheLoaded) return;

    try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            const entries: [string, CachedResponse][] = JSON.parse(cached);
            const now = Date.now();
            const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

            entries.forEach(([key, value]) => {
                if (now - value.timestamp < expiryTime) {
                    responseCache.set(key, value);
                }
            });

            __DEV__ && console.log(`Cache loaded: ${responseCache.size} responses`);
        }
        cacheLoaded = true;
    } catch (error) {
        console.error('Failed to load cache:', error);
        try {
            await AsyncStorage.removeItem(CACHE_KEY);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
};

// Save cache to storage
const saveCacheToStorage = async (): Promise<void> => {
    try {
        const entries = Array.from(responseCache.entries());
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error('Failed to save cache:', error);
        // Handle quota exceeded
        try {
            const entries = Array.from(responseCache.entries());
            const sortedByTime = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const keepCount = Math.floor(sortedByTime.length / 2);
            responseCache.clear();
            sortedByTime.slice(-keepCount).forEach(([k, v]) => responseCache.set(k, v));
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(responseCache.entries())));
        } catch (e) {
            console.error('Failed to recover from quota error:', e);
        }
    }
};

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 10;

const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const userRequests = rateLimitMap.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < 60000);

    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);
    return true;
};

const MAX_HISTORY_MESSAGES = 4; // Last 2 exchanges

export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function generateContent(
    prompt: string,
    history: AIMessage[],
    studentName: string
): Promise<string> {
    await loadCacheFromStorage();

    if (!prompt.trim()) {
        throw new Error('Empty prompt');
    }

    if (prompt.length > 500) {
        throw new Error('Message too long. Please keep your question under 500 characters.');
    }

    if (!checkRateLimit(studentName)) {
        throw new Error(`Rate limit exceeded. You can only send ${MAX_REQUESTS_PER_MINUTE} messages per minute.`);
    }

    // Check cache
    const cacheKey = prompt.toLowerCase().trim();
    if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey)!;
        __DEV__ && console.log('Cache hit for query');
        return cachedResponse.answer;
    }

    // Prepare conversation
    const recentMessages = history.slice(-MAX_HISTORY_MESSAGES);
    const conversationHistory = [
        {
            role: "system",
            content: `You are KlassyAI tutor for ${studentName}. Give brief, clear answers (max 150 words). Be helpful but concise.`
        },
        ...recentMessages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
        })),
        { role: "user", content: prompt }
    ];

    try {
        __DEV__ && console.log('Making API request');
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-small', // Changed from mistral-small-latest
                messages: conversationHistory,
                temperature: 0.3, // More deterministic
                max_tokens: 300, // Reduced for cost savings
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || errorData.message || response.statusText;
            throw new Error(`API Error: ${errorMessage}`);
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "I was unable to generate a response.";

        // Cache response
        responseCache.set(cacheKey, {
            answer: answer,
            timestamp: Date.now()
        });

        // Limit cache size
        if (responseCache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(responseCache.entries());
            const sortedByTime = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const oldestKey = sortedByTime[0][0];
            responseCache.delete(oldestKey);
        }

        saveCacheToStorage().catch(err => console.error('Cache save error:', err));

        __DEV__ && console.log('API request successful');
        return answer;
    } catch (error: any) {
        console.error('API Error:', error);
        throw new Error(error.message || 'Failed to connect to AI service');
    }
}

export const getCacheSize = (): number => responseCache.size;

export const clearCache = async (): Promise<void> => {
    responseCache.clear();
    try {
        await AsyncStorage.removeItem(CACHE_KEY);
        __DEV__ && console.log('Cache cleared');
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
};
