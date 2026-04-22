import { Platform } from 'react-native';

/**
 * Use localhost for web testing, and the local IP for physical mobile devices.
 */
const LOCAL_IP = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : 'http://192.168.1.132:8000';

export const API_URL = `${LOCAL_IP}/api`;
export const STORAGE_URL = `${LOCAL_IP}/storage`;
