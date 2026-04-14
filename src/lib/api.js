import axios from 'axios';
import { Platform } from 'react-native';

// For physical devices, you must use EXPO_PUBLIC_API_HOST=your-ip-address
// Defaults to localhost for iOS simulator and 10.0.2.2 for Android emulator
const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2:8000' : 'localhost:8000';
const BASE_DOMAIN = process.env.EXPO_PUBLIC_API_HOST || LOCAL_HOST;

export const API_URL = `http://${BASE_DOMAIN}/api`;
export const WS_URL = `ws://${BASE_DOMAIN}`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
