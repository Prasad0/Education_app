# Components

This directory contains reusable UI components for the coaching finder app.

## Component Structure

### Core Components

- **Header.tsx** - Main header with student switcher, location selector, and search bar
- **BottomNavigation.tsx** - Fixed bottom navigation with tabs (Offline, Online, Starred, Profile)
- **StudentSwitcher.tsx** - Allows parents to switch between different students
- **PromotionalBanner.tsx** - Horizontal scrollable promotional banners
- **CoachingCard.tsx** - Individual coaching center card with actions

### Usage

All components are designed to work together with the Redux store and follow a consistent design pattern.

#### Header Component
```tsx
<Header
  location="Koramangala, Bangalore"
  onLocationPress={() => setCurrentScreen('location')}
  onSearchPress={() => setCurrentScreen('listing')}
  userProfile={userProfile}
  selectedStudentId={selectedStudentId}
  onStudentSelect={setSelectedStudentId}
/>
```

#### Bottom Navigation
```tsx
<BottomNavigation
  activeTab={activeTab}
  onTabPress={handleTabPress}
/>
```

#### Coaching Card
```tsx
<CoachingCard
  center={coachingCenter}
  onBookDemo={handleBookDemo}
  onCallNow={handleCallNow}
  onToggleStar={handleToggleStar}
  isStarred={isStarred}
/>
```

## Design System

- **Colors**: Consistent color palette using hex values
- **Spacing**: 8px grid system (8, 16, 24, 32, etc.)
- **Typography**: Consistent font sizes and weights
- **Shadows**: Subtle shadows for depth
- **Border Radius**: Consistent border radius values

## Dependencies

- `@expo/vector-icons` - For icons
- `expo-linear-gradient` - For promotional banner gradients
- React Native core components
- Redux for state management
