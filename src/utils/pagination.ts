import { supabase } from '../lib/supabase';

/**
 * Pagination utilities for KlassyAI
 * Optimized for handling large datasets efficiently
 */

export const ITEMS_PER_PAGE = 50;

export interface PaginatedResult<T> {
    data: T[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
}

/**
 * Generic paginated fetch from Supabase
 * 
 * @param table - Supabase table name
 * @param page - Page number (0-indexed)
 * @param pageSize - Items per page
 * @param options - Additional query options
 */
export async function fetchPaginated<T = any>(
    table: string,
    page: number = 0,
    pageSize: number = ITEMS_PER_PAGE,
    options?: {
        filters?: Record<string, any>;
        orderBy?: { column: string; ascending?: boolean };
        select?: string;
    }
): Promise<PaginatedResult<T>> {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
        .from(table)
        .select(options?.select || '*', { count: 'exact' })
        .range(start, end);

    // Apply filters
    if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        });
    }

    // Apply ordering
    if (options?.orderBy) {
        query = query.order(
            options.orderBy.column,
            { ascending: options.orderBy.ascending ?? false }
        );
    } else {
        // Default ordering by created_at if exists
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Pagination error:', error);
        throw error;
    }

    return {
        data: (data || []) as T[],
        totalCount: count || 0,
        hasMore: count ? end < count - 1 : false,
        currentPage: page,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
    };
}

/**
 * Fetch attendance records with pagination
 */
export async function fetchAttendancePaginated(
    studentId: string,
    page: number = 0,
    pageSize: number = 30
) {
    return fetchPaginated<any>(
        'attendance',
        page,
        pageSize,
        {
            filters: { student_id: studentId },
            orderBy: { column: 'date', ascending: false },
        }
    );
}

/**
 * Fetch marks records with pagination
 */
export async function fetchMarksPaginated(
    studentId: string,
    page: number = 0,
    pageSize: number = 20
) {
    return fetchPaginated<any>(
        'marks',
        page,
        pageSize,
        {
            filters: { student_id: studentId },
            orderBy: { column: 'created_at', ascending: false },
        }
    );
}

/**
 * Fetch students list with pagination (for teachers)
 */
export async function fetchStudentsPaginated(
    teacherId: string,
    page: number = 0,
    pageSize: number = 50
) {
    return fetchPaginated<any>(
        'students',
        page,
        pageSize,
        {
            filters: { teacher_id: teacherId },
            orderBy: { column: 'name', ascending: true },
        }
    );
}

/**
 * Fetch fees records with pagination
 */
export async function fetchFeesPaginated(
    studentId: string,
    page: number = 0,
    pageSize: number = 20
) {
    return fetchPaginated<any>(
        'fees',
        page,
        pageSize,
        {
            filters: { student_id: studentId },
            orderBy: { column: 'payment_date', ascending: false },
        }
    );
}

/**
 * Fetch study materials with pagination
 */
export async function fetchMaterialsPaginated(
    teacherId: string,
    page: number = 0,
    pageSize: number = 30
) {
    return fetchPaginated<any>(
        'study_materials',
        page,
        pageSize,
        {
            filters: { teacher_id: teacherId },
            orderBy: { column: 'created_at', ascending: false },
        }
    );
}

/**
 * Calculate pagination info
 */
export function getPaginationInfo(
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number
) {
    const startItem = currentPage * itemsPerPage + 1;
    const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

    return {
        startItem,
        endItem,
        totalItems,
        currentPage: currentPage + 1, // Convert to 1-indexed for display
        totalPages,
        isFirstPage: currentPage === 0,
        isLastPage: currentPage === totalPages - 1,
    };
}
