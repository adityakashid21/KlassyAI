# 🎓 KlassyAI

> An AI-powered smart classroom management and interactive learning platform built with **React Native (CLI)**, **TypeScript**, **Supabase**, and **Mistral AI**.

---

[![React Native](https://img.shields.io/badge/React_Native-0.83.1-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Mistral AI](https://img.shields.io/badge/AI_Engine-Mistral_AI-FF7000?style=for-the-badge)](https://mistral.ai)
[![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-brightgreen?style=for-the-badge)](https://reactnative.dev)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

**KlassyAI** is an all-in-one educational platform designed to streamline classroom management for educators while providing students with an interactive, AI-driven learning experience. By combining real-time database infrastructure, AI study assistance, role-based workflows, and detailed analytics, KlassyAI bridges the gap between traditional teaching and modern EdTech.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
- 🤖 **AI Tutor Companion**: Interactive AI chat powered by Mistral AI for 24/7 homework help, concept clarification, and study guidance.
- 📊 **Performance Analytics**: Visual score distributions, subject breakdown, and grade trajectory charts.
- 📅 **Attendance Tracker**: Calendar-based attendance logging with attendance percentage calculators.
- 💳 **Fee Management**: Transparent view of fee structures, payment histories, due dates, and downloadable receipts.
- 📚 **Study Material Hub**: Access class notes, reference documents, and study guides uploaded by teachers.
- 📢 **Notice Board**: Instant updates on school announcements, exam schedules, and holiday notices.

### 👩‍🏫 Teacher Portal
- 👥 **Student Directory**: Comprehensive list of students with detailed profile metrics and academic history.
- 📝 **Attendance & Marks Entry**: Quick tools for marking attendance, entering exam scores, and calculating class averages.
- 📈 **Classroom Analytics**: Aggregate insight into overall class performance, attendance trends, and topic mastery.
- 📑 **Syllabus & Course Tracking**: Track curriculum progress and mark completion milestones.
- 📤 **Resource Sharing**: Upload and distribute study materials, assignments, and announcements.

### ⚡ Infrastructure & UX
- 🔔 **Push Notifications**: Local and remote notification triggers powered by `@notifee/react-native`.
- 📄 **PDF Export & Printing**: Export receipts, marks statements, and reports using native PDF tools.
- 🔒 **Enterprise-Grade Security**: Row Level Security (RLS) policies on Supabase for isolated multi-tenant data access.
- 🚀 **High Performance Architecture**: Optimized SQL indexing, pagination, and local caching service supporting 1,000+ daily active users.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React Native CLI](https://reactnative.dev/) (v0.83.1) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (v5.8.3) in Strict Mode |
| **Backend & DB** | [Supabase](https://supabase.com/) (PostgreSQL, Realtime Auth, Storage) |
| **AI Engine** | [Mistral AI API](https://mistral.ai/) |
| **Navigation** | [React Navigation](https://reactnavigation.org/) v7 (Native Stack & Bottom Tabs) |
| **Icons & UI** | `lucide-react-native`, `react-native-svg`, `react-native-linear-gradient` |
| **Data Viz & UI Tools** | `react-native-chart-kit`, `react-native-calendars` |
| **Notifications** | [`@notifee/react-native`](https://notifee.app/) |
| **File & Printing** | `react-native-html-to-pdf`, `react-native-print`, `react-native-fs` |

---

## 📁 Project Structure

```
KlassyAIApp/
├── 📁 android/                     # Native Android project configuration
├── 📁 ios/                         # Native iOS project configuration
├── 📁 src/                         # Core application source code
│   ├── 📁 constants/               # Global design tokens and color constants
│   ├── 📁 hooks/                   # Custom hooks (e.g., useOptimizedData)
│   ├── 📁 lib/                     # Supabase client setup & configuration
│   ├── 📁 navigation/              # Navigation graphs (Root, Student, Teacher)
│   ├── 📁 screens/                 # Application screens
│   │   ├── LoadingScreen.tsx       # Animated splash & loading screen
│   │   ├── 📁 auth/                # Login, Register, Role selection screens
│   │   ├── 📁 common/              # Shared screens (e.g., AITutorScreen)
│   │   ├── 📁 student/             # Student portal screens (Academics, Marks, Fees, etc.)
│   │   └── 📁 teacher/             # Teacher portal screens (Attendance, Marks, Syllabus, etc.)
│   ├── 📁 services/                # Business logic services
│   │   ├── ai.ts                   # Mistral AI integration service
│   │   ├── cache.ts                # Offline & data caching layer
│   │   └── notifications.ts        # Notifee notification manager
│   └── 📁 utils/                   # Pagination & helper utilities
├── database_optimization.sql       # Database indexes & query optimizations
├── supabase_security_policies.sql  # Supabase Row Level Security (RLS) policies
├── App.tsx                         # Root app entry point
├── package.json                    # Dependencies & scripts
└── tsconfig.json                   # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: `v20.0.0` or higher
- **JDK**: Java Development Kit 17
- **Android Studio** (with Android SDK & Emulator configured)
- **Xcode** & CocoaPods (macOS only, for iOS development)

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adityakashid21/KlassyAIApp.git
   cd KlassyAIApp
   ```

2. **Install JavaScript dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Update `src/lib/supabase.ts` with your Supabase URL and Anon Key:
   ```typescript
   export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

---

### Running on Android

```bash
# Start Metro Bundler
npm start

# In a separate terminal, launch Android App
npm run android
```

### Running on iOS (macOS)

```bash
cd ios && pod install && cd ..
npm run ios
```

---

## 🗄️ Database & Security Setup

1. **Database Indexing & Performance**:
   Execute `database_optimization.sql` in your Supabase SQL Editor to apply indexing for fast querying:
   ```bash
   # Applies composite indexes on attendance, fees, marks, and student lookup queries
   ```

2. **Row Level Security (RLS)**:
   Execute `supabase_security_policies.sql` to enforce strict student and teacher data separation.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm start` | Launches the Metro bundler |
| `npm run android` | Builds and installs the Android APK onto connected device/emulator |
| `npm run ios` | Builds and launches the iOS app in simulator |
| `npm run lint` | Runs ESLint for static code analysis |
| `npm run test` | Runs Jest unit tests |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
