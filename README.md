# Coaching Finder App

A React Native application for finding the best coaches in your area, built with Redux Toolkit for state management.

## Features

- **Phone Number Login**: Secure authentication using phone number
- **OTP Verification**: One-time password verification system
- **Modern UI**: Clean and intuitive user interface
- **Redux Toolkit**: Efficient state management
- **TypeScript**: Type-safe development experience

## Tech Stack

- React Native 0.73.2
- Redux Toolkit 2.0.1
- React Navigation 6
- TypeScript 5.0.4

## Project Structure

```
coaching-finder-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   └── OtpScreen.tsx
│   └── store/
│       ├── slices/
│       │   └── authSlice.ts
│       ├── hooks.ts
│       └── store.ts
├── App.tsx
├── index.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio / Xcode (for mobile development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coaching-finder-app
```

2. Install dependencies:
```bash
npm install
```

3. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

4. Start the Metro bundler:
```bash
npm start
```

5. Run the app:
```bash
# Android
npm run android

# iOS
npm run ios
```

## Usage

### Demo Credentials

- **Phone Number**: Any valid phone number (10+ digits)
- **OTP**: `123456` (demo OTP for testing)

### Flow

1. **Login Screen**: Enter your phone number
2. **OTP Screen**: Enter the 6-digit verification code
3. **Verification**: App validates the OTP and proceeds

## State Management

The app uses Redux Toolkit for state management with the following structure:

- **Auth Slice**: Handles authentication state (phone number, OTP, loading, errors)
- **Async Thunks**: `sendOtp` and `verifyOtp` for API calls
- **Typed Hooks**: `useAppDispatch` and `useAppSelector` for type-safe Redux usage

## Customization

### Styling

All styles are defined using React Native StyleSheet. You can customize colors, fonts, and layouts in the respective screen files.

### API Integration

Replace the simulated API calls in `authSlice.ts` with your actual authentication endpoints:

```typescript
// Replace this in sendOtp thunk
const response = await api.sendOtp(phoneNumber);

// Replace this in verifyOtp thunk
const response = await api.verifyOtp(phoneNumber, otp);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
