import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';
import { StatusBar } from 'react-native';

// Screens
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AITutorScreen from '../screens/common/AITutorScreen';

// Teacher Screens
import StudentsListScreen from '../screens/teacher/StudentsListScreen';
import AttendanceScreen from '../screens/teacher/attendance/AttendanceScreen';
import FeesScreen from '../screens/teacher/fees/FeesScreen';
import MarksScreen from '../screens/teacher/marks/MarksScreen';
import MaterialsScreen from '../screens/teacher/materials/MaterialsScreen';
import NoticesScreen from '../screens/teacher/notices/NoticesScreen';
import SyllabusScreen from '../screens/teacher/syllabus/SyllabusScreen';
import TeacherAnalyticsScreen from '../screens/teacher/TeacherAnalyticsScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';

// Student Screens
import StudentMarksScreen from '../screens/student/StudentMarksScreen';
import StudentMaterialsScreen from '../screens/student/StudentMaterialsScreen';
import StudentAnalyticsScreen from '../screens/student/StudentAnalyticsScreen';

// Tab Navigators
import TeacherTabNavigator from './TeacherTabNavigator';
import StudentTabNavigator from './StudentTabNavigator';

// Define types for better safety (optional but good practice)
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;

    // Teacher
    TeacherTabs: undefined;
    StudentsList: undefined;
    Attendance: undefined;
    Fees: undefined;
    Marks: undefined;
    Materials: undefined;
    Notices: undefined;
    Syllabus: undefined;
    TeacherAnalytics: undefined;

    // Student
    StudentTabs: undefined;
    StudentMarks: undefined;
    StudentMaterials: undefined;
    StudentAnalytics: undefined;

    // Common
    AITutor: { studentName?: string };
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<'student' | 'teacher' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) checkUserRole(session.user.id);
            else setLoading(false);
        });

        // Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                checkUserRole(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserRole = async (userId: string) => {
        // Check if Teacher
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (teacher) {
            setRole('teacher');
            setLoading(false);
            return;
        }

        // Check if Student
        const { data: student } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (student) {
            setRole('student');
        }
        setLoading(false);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    const MyTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: COLORS.background,
            card: COLORS.surface,
            text: COLORS.text,
            primary: COLORS.primary,
        },
    };

    return (
        <NavigationContainer theme={MyTheme}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                {session && role ? (
                    role === 'teacher' ? (
                        <Stack.Group>
                            <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
                            <Stack.Screen name="StudentsList" component={StudentsListScreen} />
                            <Stack.Screen name="Attendance" component={AttendanceScreen} />
                            <Stack.Screen name="Fees" component={FeesScreen} />
                            <Stack.Screen name="Marks" component={MarksScreen} />
                            <Stack.Screen name="Materials" component={MaterialsScreen} />
                            <Stack.Screen name="Notices" component={NoticesScreen} />
                            <Stack.Screen name="Syllabus" component={SyllabusScreen} />
                            <Stack.Screen name="TeacherAnalytics" component={TeacherAnalyticsScreen} />
                        </Stack.Group>
                    ) : (
                        <Stack.Group>
                            <Stack.Screen name="StudentTabs" component={StudentTabNavigator} />
                            <Stack.Screen name="StudentMarks" component={StudentMarksScreen} />
                            <Stack.Screen name="StudentMaterials" component={StudentMaterialsScreen} />
                            <Stack.Screen name="StudentAnalytics" component={StudentAnalyticsScreen} />
                            <Stack.Screen name="Profile" component={ProfileScreen} />
                        </Stack.Group>
                    )
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}

                {/* Common Screens accessible by both or specific roles if logged in */}
                {session && (
                    <>
                        <Stack.Screen name="AITutor" component={AITutorScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
