# KlassyAI Mobile App - Tech Stack & Dependencies

## 1. Install Dependencies
Run these commands in your project root:

```bash
# Core Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# Backend (Supabase)
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# UI & Styling
npm install react-native-linear-gradient react-native-svg lucide-react-native
```

## 2. Platform Setup

### Android
No special linking required for these libraries in React Native 0.70+. They should auto-link.
If you face issues with `react-native-linear-gradient`:
1. Clean build: `cd android && ./gradlew clean`
2. Rebuild: `cd .. && npm run android`

### iOS (If applicable)
1. `cd ios && pod install && cd ..`

## 3. Icons
We are using `lucide-react-native` which depends on `react-native-svg`. This is much easier to manage than Vector Icons as it doesn't require font linking.

## 4. Supabase Credentials
The app is pre-configured with your credentials in `src/lib/supabase.ts`.
