/**
 * KlassyAI Mobile App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import notifee, { EventType } from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';

import { NotificationService } from './src/services/notifications';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize notification channels and permissions
    NotificationService.initialize();

    // Handle notification taps (when app is open)
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.filePath) {
        try {
          await FileViewer.open(detail.notification.data.filePath as string, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
          });
        } catch (error) {
          console.log('Could not open file:', error);
        }
      }
    });

    // Handle notification taps (when app is closed/background)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.filePath) {
        try {
          await FileViewer.open(detail.notification.data.filePath as string, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
          });
        } catch (error) {
          console.log('Could not open file:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
