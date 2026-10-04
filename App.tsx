/**
 * KlassyAI Mobile App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import notifee, { EventType } from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';

import { NotificationService } from './src/services/notifications';
import DevTestScreen from './src/screens/common/DevTestScreen';

function App(): React.JSX.Element {
  // Temporary flag to show dev test screen
  const [showDevScreen, setShowDevScreen] = useState(__DEV__);

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
      {showDevScreen ? (
        <DevTestScreen onDismiss={() => setShowDevScreen(false)} />
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}

export default App;
