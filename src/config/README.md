# API Configuration

This directory contains the API configuration for the coaching finder app.

## Environment Variables

The app uses environment variables stored in the `.env` file at the root of the project:

```env
BASE_URL: 'https://learn.crusheducation.in',
  API_BASE_URL: 'https://learn.crusheducation.in/api',
 
```

## Configuration Structure

- `BASE_URL`: The base URL for the API server
- `API_BASE_URL`: The base URL for API endpoints
- `ENDPOINTS`: Object containing all API endpoint paths

## Usage

```typescript
import { api, getApiUrl, API_CONFIG } from '../config/api';

// Get full URL for an endpoint (if you need the absolute URL)
const sendOtpUrl = getApiUrl(API_CONFIG.ENDPOINTS.SEND_OTP);

// Use centralized API instance (interceptors handle headers/tokens)
const response = await api.post(API_CONFIG.ENDPOINTS.SEND_OTP, data);
```

## Adding New Endpoints

To add a new endpoint, update the `ENDPOINTS` object in `api.ts`:

```typescript
ENDPOINTS: {
  SEND_OTP: '/user_auth/users/send_otp/',
  VERIFY_OTP: '/user_auth/users/verify_otp/',
  NEW_ENDPOINT: '/new/path/here/',
}
```

## Security Note

The `.env` file is included in `.gitignore` to prevent sensitive information from being committed to version control. Always ensure environment variables are properly configured for each deployment environment.
