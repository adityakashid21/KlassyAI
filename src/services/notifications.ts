import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { supabase } from '../lib/supabase';

export class NotificationService {
    static async initialize() {
        await notifee.requestPermission();
        await this.createChannels();
    }

    static async createChannels() {
        // Channel for marks updates
        await notifee.createChannel({
            id: 'marks',
            name: 'Marks Updates',
            importance: AndroidImportance.HIGH,
            sound: 'default'
        });

        // Channel for attendance
        await notifee.createChannel({
            id: 'attendance',
            name: 'Attendance Updates',
            importance: AndroidImportance.HIGH,
            sound: 'default'
        });

        // Channel for fees
        await notifee.createChannel({
            id: 'fees',
            name: 'Fee Updates',
            importance: AndroidImportance.HIGH,
            sound: 'default'
        });

        // Channel for notices
        await notifee.createChannel({
            id: 'notices',
            name: 'Important Notices',
            importance: AndroidImportance.HIGH,
            sound: 'default'
        });

        // Channel for materials
        await notifee.createChannel({
            id: 'materials',
            name: 'Study Materials',
            importance: AndroidImportance.DEFAULT,
            sound: 'default'
        });

        // Channel for teacher engagement
        await notifee.createChannel({
            id: 'engagement',
            name: 'KlassyAI Tips',
            importance: AndroidImportance.LOW,
            sound: 'default'
        });

        // Channel for file downloads
        await notifee.createChannel({
            id: 'downloads',
            name: 'File Downloads',
            importance: AndroidImportance.HIGH,
            sound: 'default'
        });
    }

    // Show notification for new marks
    static async showMarksNotification(subject: string, score: number, maxScore: number) {
        const percentage = ((score / maxScore) * 100).toFixed(1);

        await notifee.displayNotification({
            title: '🎯 New Marks Added!',
            body: `${subject}: ${score}/${maxScore} (${percentage}%)`,
            android: {
                channelId: 'marks',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
                color: '#1E88E5',
                smallIcon: 'ic_notification',
                largeIcon: 'ic_launcher'
            }
        });
    }

    // Show notification for attendance
    static async showAttendanceNotification(status: string, date: string) {
        const emoji = status === 'present' ? '✅' : status === 'late' ? '⏰' : '❌';
        const message = status === 'present' ? 'Marked Present' :
            status === 'late' ? 'Marked Late' : 'Marked Absent';

        await notifee.displayNotification({
            title: `${emoji} Attendance Updated`,
            body: `${message} for ${new Date(date).toLocaleDateString()}`,
            android: {
                channelId: 'attendance',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
                color: status === 'present' ? '#4CAF50' : status === 'late' ? '#FF9800' : '#F44336'
            }
        });
    }

    // Show notification for fees
    static async showFeeNotification(month: string, year: string, amount: number, status: string) {
        const isPaid = status === 'paid';

        await notifee.displayNotification({
            title: isPaid ? '✅ Fee Payment Confirmed' : '📋 Fee Record Added',
            body: `${month} ${year} - ₹${amount}`,
            android: {
                channelId: 'fees',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
                color: isPaid ? '#4CAF50' : '#FF9800'
            }
        });
    }

    // Show notification for new notice
    static async showNoticeNotification(title: string, preview: string) {
        await notifee.displayNotification({
            title: '📢 New Notice',
            body: `${title}\n${preview.substring(0, 100)}...`,
            android: {
                channelId: 'notices',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
                color: '#E53935',
                style: { type: 0, text: preview }
            }
        });
    }

    // Show notification for new study material
    static async showMaterialNotification(topicName: string) {
        await notifee.displayNotification({
            title: '📚 New Study Material',
            body: topicName,
            android: {
                channelId: 'materials',
                importance: AndroidImportance.DEFAULT,
                pressAction: { id: 'default' },
                color: '#7E57C2'
            }
        });
    }

    // TEACHER ENGAGEMENT NOTIFICATIONS
    static async showTeacherWelcome(teacherName: string) {
        await notifee.displayNotification({
            title: `Welcome ${teacherName}! 🎉`,
            body: 'Start by adding your students. Tap here to begin!',
            android: {
                channelId: 'engagement',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
                color: '#1E88E5'
            }
        });
    }

    static async showTeacherTip(tip: string) {
        await notifee.displayNotification({
            title: '💡 KlassyAI Tip',
            body: tip,
            android: {
                channelId: 'engagement',
                importance: AndroidImportance.LOW,
                pressAction: { id: 'default' },
                color: '#FFA726'
            }
        });
    }

    static async showStudentAddedSuccess(studentName: string, totalStudents: number) {
        await notifee.displayNotification({
            title: '✅ Student Added Successfully!',
            body: `${studentName} is now enrolled. Total students: ${totalStudents}`,
            android: {
                channelId: 'engagement',
                importance: AndroidImportance.DEFAULT,
                pressAction: { id: 'default' },
                color: '#66BB6A'
            }
        });
    }

    static async showMarksAddedSuccess(count: number) {
        await notifee.displayNotification({
            title: '🎯 Marks Saved!',
            body: `${count} student${count > 1 ? 's' : ''} will be notified about their new marks`,
            android: {
                channelId: 'engagement',
                importance: AndroidImportance.DEFAULT,
                pressAction: { id: 'default' },
                color: '#42A5F5'
            }
        });
    }

    static async showAttendanceMarkedSuccess(presentCount: number, totalCount: number) {
        await notifee.displayNotification({
            title: '✅ Attendance Marked!',
            body: `${presentCount}/${totalCount} students present today`,
            android: {
                channelId: 'engagement',
                importance: AndroidImportance.DEFAULT,
                pressAction: { id: 'default' },
                color: '#66BB6A'
            }
        });
    }

    static async showFeatureHighlight(feature: string, benefit: string) {
        await notifee.displayNotification({
            title: `⭐ ${feature}`,
            body: benefit,
            android: {
                channelId: 'engagement',
                importance: AndroidImportance.LOW,
                pressAction: { id: 'default' },
                color: '#AB47BC'
            }
        });
    }

    // Scheduled reminder for teacher to mark attendance
    static async scheduleAttendanceReminder() {
        const date = new Date();
        date.setHours(10, 0, 0, 0); // 10 AM daily

        await notifee.createTriggerNotification(
            {
                title: '📝 Time to Mark Attendance',
                body: 'Don\'t forget to mark today\'s attendance!',
                android: {
                    channelId: 'engagement',
                    pressAction: { id: 'default' },
                    color: '#FF7043'
                }
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: date.getTime(),
                repeatFrequency: 1 // Daily
            }
        );
    }
}

// Setup Supabase Realtime listeners
export const setupRealtimeNotifications = async (userId: string, userType: 'student' | 'teacher') => {
    if (userType === 'student') {
        // Get student ID
        const { data: student } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!student) return;

        // Listen for new marks
        supabase
            .channel('marks-changes')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'marks',
                    filter: `student_id=eq.${student.id}`
                },
                (payload) => {
                    const mark = payload.new;
                    NotificationService.showMarksNotification(
                        mark.subject,
                        mark.score,
                        mark.max_score
                    );
                }
            )
            .subscribe();

        // Listen for new attendance
        supabase
            .channel('attendance-changes')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'attendance',
                    filter: `student_id=eq.${student.id}`
                },
                (payload) => {
                    const attendance = payload.new;
                    NotificationService.showAttendanceNotification(
                        attendance.status,
                        attendance.date
                    );
                }
            )
            .subscribe();

        // Listen for new fees
        supabase
            .channel('fees-changes')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'fees',
                    filter: `student_id=eq.${student.id}`
                },
                (payload) => {
                    const fee = payload.new;
                    NotificationService.showFeeNotification(
                        fee.month,
                        fee.year,
                        fee.amount,
                        fee.status
                    );
                }
            )
            .subscribe();

        // Listen for new notices
        const { data: studentData } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('id', student.id)
            .single();

        if (studentData) {
            supabase
                .channel('notices-changes')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notices',
                        filter: `teacher_id=eq.${studentData.teacher_id}`
                    },
                    (payload) => {
                        const notice = payload.new;
                        NotificationService.showNoticeNotification(
                            notice.title,
                            notice.content
                        );
                    }
                )
                .subscribe();

            // Listen for new materials
            supabase
                .channel('materials-changes')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'study_materials',
                        filter: `teacher_id=eq.${studentData.teacher_id}`
                    },
                    (payload) => {
                        const material = payload.new;
                        NotificationService.showMaterialNotification(
                            material.topic_name
                        );
                    }
                )
                .subscribe();
        }
    }
};
