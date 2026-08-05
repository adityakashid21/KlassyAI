import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Advanced Caching System for KlassyAI
 * Optimized for 1000+ daily active users
 * 
 * Features:
 * - Automatic expiry
 * - Type-safe
 * - Memory efficient
 * - Error handling
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresIn: number;
}

// Cache duration constants (in milliseconds)
export const CACHE_DURATION = {
    PROFILE: 24 * 60 * 60 * 1000,      // 1 day
    ATTENDANCE: 6 * 60 * 60 * 1000,    // 6 hours
    MARKS: 12 * 60 * 60 * 1000,        // 12 hours
    MATERIALS: 24 * 60 * 60 * 1000,    // 1 day
    FEES: 24 * 60 * 60 * 1000,         // 1 day
    STUDENTS: 12 * 60 * 60 * 1000,     // 12 hours (for teachers)
    SYLLABUS: 24 * 60 * 60 * 1000,     // 1 day
};

export class CacheManager {
    private static PREFIX = 'klassyai_cache_';

    /**
     * Generic set method - stores data with expiry
     */
    static async set<T>(
        key: string,
        data: T,
        expiresIn: number
    ): Promise<void> {
        try {
            const cacheItem: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                expiresIn,
            };
            await AsyncStorage.setItem(
                `${this.PREFIX}${key}`,
                JSON.stringify(cacheItem)
            );
        } catch (error) {
            console.error('Cache set error:', error);
            // Fail silently - don't break app if caching fails
        }
    }

    /**
     * Generic get method - retrieves data if not expired
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const cached = await AsyncStorage.getItem(`${this.PREFIX}${key}`);
            if (!cached) return null;

            const cacheItem: CacheItem<T> = JSON.parse(cached);
            const now = Date.now();

            // Check if expired
            if (now - cacheItem.timestamp > cacheItem.expiresIn) {
                await AsyncStorage.removeItem(`${this.PREFIX}${key}`);
                return null;
            }

            console.log(`✅ Cache hit: ${key}`);
            return cacheItem.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Remove specific cache entry
     */
    static async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(`${this.PREFIX}${key}`);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    }

    // ============================================
    // SPECIFIC CACHE METHODS FOR APP DATA
    // ============================================

    /**
     * Student Profile Caching
     */
    static async cacheStudentProfile(studentId: string, data: any) {
        await this.set(`student_${studentId}`, data, CACHE_DURATION.PROFILE);
    }

    static async getStudentProfile(studentId: string) {
        return await this.get(`student_${studentId}`);
    }

    static async invalidateStudentProfile(studentId: string) {
        await this.remove(`student_${studentId}`);
    }

    /**
     * Attendance Caching
     */
    static async cacheAttendance(studentId: string, data: any) {
        await this.set(`attendance_${studentId}`, data, CACHE_DURATION.ATTENDANCE);
    }

    static async getAttendance(studentId: string) {
        return await this.get(`attendance_${studentId}`);
    }

    static async invalidateAttendance(studentId: string) {
        await this.remove(`attendance_${studentId}`);
    }

    /**
     * Marks Caching
     */
    static async cacheMarks(studentId: string, data: any) {
        await this.set(`marks_${studentId}`, data, CACHE_DURATION.MARKS);
    }

    static async getMarks(studentId: string) {
        return await this.get(`marks_${studentId}`);
    }

    static async invalidateMarks(studentId: string) {
        await this.remove(`marks_${studentId}`);
    }

    /**
     * Study Materials Caching
     */
    static async cacheMaterials(teacherId: string, data: any) {
        await this.set(`materials_${teacherId}`, data, CACHE_DURATION.MATERIALS);
    }

    static async getMaterials(teacherId: string) {
        return await this.get(`materials_${teacherId}`);
    }

    static async invalidateMaterials(teacherId: string) {
        await this.remove(`materials_${teacherId}`);
    }

    /**
     * Fees Caching
     */
    static async cacheFees(studentId: string, data: any) {
        await this.set(`fees_${studentId}`, data, CACHE_DURATION.FEES);
    }

    static async getFees(studentId: string) {
        return await this.get(`fees_${studentId}`);
    }

    static async invalidateFees(studentId: string) {
        await this.remove(`fees_${studentId}`);
    }

    /**
     * Students List Caching (for teachers)
     */
    static async cacheStudentsList(teacherId: string, data: any) {
        await this.set(`students_${teacherId}`, data, CACHE_DURATION.STUDENTS);
    }

    static async getStudentsList(teacherId: string) {
        return await this.get(`students_${teacherId}`);
    }

    static async invalidateStudentsList(teacherId: string) {
        await this.remove(`students_${teacherId}`);
    }

    /**
     * Syllabus Caching
     */
    static async cacheSyllabus(teacherId: string, data: any) {
        await this.set(`syllabus_${teacherId}`, data, CACHE_DURATION.SYLLABUS);
    }

    static async getSyllabus(teacherId: string) {
        return await this.get(`syllabus_${teacherId}`);
    }

    static async invalidateSyllabus(teacherId: string) {
        await this.remove(`syllabus_${teacherId}`);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Clear all KlassyAI cache
     */
    static async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
                console.log(`✅ Cleared ${cacheKeys.length} cache entries`);
            }
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    /**
     * Get cache statistics
     */
    static async getStats(): Promise<{
        totalEntries: number;
        estimatedSize: string;
    }> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));

            return {
                totalEntries: cacheKeys.length,
                estimatedSize: `~${(cacheKeys.length * 5).toFixed(1)} KB`,
            };
        } catch (error) {
            console.error('Cache stats error:', error);
            return { totalEntries: 0, estimatedSize: '0 KB' };
        }
    }

    /**
     * Clean expired cache entries
     */
    static async cleanExpired(): Promise<number> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));

            let cleaned = 0;
            for (const fullKey of cacheKeys) {
                const key = fullKey.replace(this.PREFIX, '');
                const data = await this.get(key);
                if (data === null) {
                    cleaned++;
                }
            }

            console.log(`✅ Cleaned ${cleaned} expired cache entries`);
            return cleaned;
        } catch (error) {
            console.error('Cache cleanup error:', error);
            return 0;
        }
    }
}

// Export for easy access
export default CacheManager;
