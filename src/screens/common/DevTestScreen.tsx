import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { COLORS } from '../../constants/theme';

interface DevTestScreenProps {
  onDismiss: () => void;
}

export default function DevTestScreen({ onDismiss }: DevTestScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>iOS TEST BUILD</Text>
        </View>

        <Text style={styles.title}>HELLO DEVS 👋</Text>
        
        <Text style={styles.subtitle}>
          I'm running Kalyai on iOS{'\n'}from a Windows machine.
        </Text>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>iOS Simulator</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>React Native CLI</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Windows Development Environment</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Platform: {Platform.OS}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Continue to App →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Uses project theme background
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: COLORS.primary + '20', // Primary with opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.textSecondary || '#888',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
  },
  statusSection: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: COLORS.border || '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success || '#4CAF50',
    marginRight: 12,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
