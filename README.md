# LogForge — Mobile App

iOS and Android application for LogForge, built with React Native and Expo.

Monitor your logs, receive alerts, and explore your application events on the go.

## Tech Stack

- **Expo** (SDK 54) + **Expo Router** — File-based navigation
- **React Native 0.81** — Cross-platform UI
- **Expo Blur & Haptics** — Native feel, "Liquid Glass" UI on iOS
- **Lucide Icons**

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Android Emulator, or the Expo Go app on a physical device

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file at the root of the project:

```env
EXPO_PUBLIC_API_HOST=http://YOUR_LOCAL_IP:8000
```

> Use your machine's local IP address (not `localhost`) so the physical device or emulator can reach the backend.

## Running

```bash
npx expo start
```

Then press:
- `i` — open iOS Simulator
- `a` — open Android Emulator
- Scan the QR code with Expo Go on a physical device

## Features

- Real-time log monitoring via WebSocket
- Filter logs by level, channel, environment, and time range
- Push notifications for critical alerts
- Haptic feedback on interactions
- Dark / Light mode

## Project Structure

```
logforge-mobile-app/
├── app/           # Expo Router pages
├── components/    # Shared UI components
├── hooks/         # Custom React hooks
├── constants/     # Colors, config constants
└── assets/        # Images and fonts
```

## License

MIT — see [LICENCE](LICENCE)
