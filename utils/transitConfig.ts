// utils/transitConfig.ts
// Configuration and utilities for public transport routing

export interface TransitConfig {
  otpBaseUrl: string | null;
  fallbackEnabled: boolean;
  maxWalkDistance: number;
  requestTimeout: number;
  debugLogging: boolean;
}

// Get transit configuration from environment and defaults
export function getTransitConfig(): TransitConfig {
  const otpBaseUrl = getOTPBaseUrl();
  
  return {
    otpBaseUrl,
    fallbackEnabled: true,
    maxWalkDistance: 1000, // meters
    requestTimeout: 10000, // 10 seconds
    debugLogging: __DEV__ || false
  };
}

// Get OTP base URL from environment variables
export function getOTPBaseUrl(): string | null {
  if (typeof process !== 'undefined' && process?.env) {
    return process.env.OTP_BASE_URL || process.env.EXPO_PUBLIC_OTP_BASE_URL || null;
  }
  return null;
}

// Check if OTP is properly configured
export function isOTPConfigured(): boolean {
  const url = getOTPBaseUrl();
  return url !== null && url.trim() !== '';
}

// Validate OTP URL format
export function validateOTPUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL cannot be empty' };
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Test OTP server connectivity
export async function testOTPConnection(baseUrl?: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
  const url = baseUrl || getOTPBaseUrl();
  
  if (!url) {
    return { success: false, error: 'No OTP URL configured' };
  }
  
  const validation = validateOTPUrl(url);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  try {
    const startTime = Date.now();
    
    // Test with a simple plan request (Bucharest coordinates)
    const testUrl = `${url.replace(/\/$/, '')}/otp/routers/default/plan?` +
      `fromPlace=44.4268,26.1025&` +
      `toPlace=44.4378,26.0969&` +
      `mode=TRANSIT,WALK&` +
      `date=${new Date().toISOString().split('T')[0]}&` +
      `time=10:00&` +
      `numItineraries=1`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `Server returned ${response.status}: ${response.statusText}`,
        responseTime 
      };
    }
    
    // Try to parse JSON to ensure it's a valid OTP response
    const data = await response.json();
    
    if (data.error) {
      // OTP returned an error, but server is working
      return { 
        success: true, 
        error: `OTP planning error: ${data.error.msg || 'Unknown error'}`,
        responseTime 
      };
    }
    
    return { success: true, responseTime };
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Connection timeout (>10s)' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown connection error' };
  }
}

// Get transit configuration status for debugging
export function getTransitStatus(): {
  otpConfigured: boolean;
  otpUrl: string | null;
  fallbackAvailable: boolean;
  config: TransitConfig;
} {
  const config = getTransitConfig();
  
  return {
    otpConfigured: isOTPConfigured(),
    otpUrl: config.otpBaseUrl,
    fallbackAvailable: config.fallbackEnabled,
    config
  };
}

// Log transit configuration (for debugging)
export function logTransitStatus(): void {
  const status = getTransitStatus();
  
  console.log('[TransitConfig] Status:', {
    'OTP Configured': status.otpConfigured,
    'OTP URL': status.otpUrl || 'Not set',
    'Fallback Available': status.fallbackAvailable,
    'Max Walk Distance': `${status.config.maxWalkDistance}m`,
    'Request Timeout': `${status.config.requestTimeout}ms`,
    'Debug Logging': status.config.debugLogging
  });
  
  if (!status.otpConfigured) {
    console.warn('[TransitConfig] OTP not configured. Set OTP_BASE_URL or EXPO_PUBLIC_OTP_BASE_URL environment variable.');
    console.warn('[TransitConfig] Falling back to basic transit routing.');
  }
}

// Environment setup helper for development
export function getSetupInstructions(): string {
  const platform = process.platform || 'unknown';
  
  const instructions = `
Public Transport Setup Instructions:

1. Set environment variable before starting the app:

   ${platform === 'win32' ? 'Windows (PowerShell):' : 'macOS/Linux:'}
   ${platform === 'win32' 
     ? '$env:EXPO_PUBLIC_OTP_BASE_URL="https://your-otp-server.com"' 
     : 'export EXPO_PUBLIC_OTP_BASE_URL="https://your-otp-server.com"'
   }

2. Start the app:
   npx expo start

3. Test the connection:
   Check console logs for "[TransitRouter]" messages

For more details, see docs/PUBLIC_TRANSPORT_SETUP.md
`;

  return instructions;
}
