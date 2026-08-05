import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import { Home, CalendarCheck, DollarSign, Bell, BookOpen } from 'lucide-react-native';
import { Platform, View } from 'react-native';

// Screens
import StudentHomeScreen from '../screens/main/StudentHomeScreen';
import StudentAttendanceScreen from '../screens/student/StudentAttendanceScreen';
import StudentFeesScreen from '../screens/student/StudentFeesScreen';
import StudentNoticesScreen from '../screens/student/StudentNoticesScreen';
import StudentAcademicsScreen from '../screens/student/StudentAcademicsScreen';

const Tab = createBottomTabNavigator();

export default function StudentTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.border,
                    height: Platform.OS === 'ios' ? 90 : 70, // Taller tabs
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Overview"
                component={StudentHomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Attendance"
                component={StudentAttendanceScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Academics"
                component={StudentAcademicsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Fees"
                component={StudentFeesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Notices"
                component={StudentNoticesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}
