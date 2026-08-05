import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Home, Users, Grid, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';

// Screens
import TeacherHomeScreen from '../screens/main/TeacherHomeScreen';
import StudentsListScreen from '../screens/teacher/StudentsListScreen';
import ToolsScreen from '../screens/teacher/tools/ToolsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator() {
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
                name="Dashboard"
                component={TeacherHomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Students"
                component={StudentsListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Tools"
                component={ToolsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Grid color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}
