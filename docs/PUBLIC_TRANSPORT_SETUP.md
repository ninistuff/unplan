# Public Transport Setup Guide

This guide explains how to set up and troubleshoot public transport routing in the Unplan app.

## Overview

The app supports public transport routing through two methods:

1. **OpenTripPlanner (OTP)** - Full GTFS-based routing (recommended)
2. **Fallback routing** - Basic heuristic-based routing when OTP is unavailable

## OpenTripPlanner Setup

### Prerequisites

- A running OpenTripPlanner server with GTFS data for your region
- Network access to the OTP server from your development environment

### Configuration

Set one of these environment variables before starting the app:

```bash
# Option 1: Standard environment variable
export OTP_BASE_URL=https://your-otp-server.com

# Option 2: Expo-specific environment variable
export EXPO_PUBLIC_OTP_BASE_URL=https://your-otp-server.com

# Then start the app
npx expo start
```

### Testing OTP Connection

You can test if your OTP server is working by making a direct API call:

```bash
curl "https://your-otp-server.com/otp/routers/default/plan?fromPlace=44.4268,26.1025&toPlace=44.4378,26.0969&mode=TRANSIT,WALK&date=2024-01-15&time=10:00&numItineraries=1"
```

### Common OTP Issues

1. **Server not responding**: Check if the OTP server is running and accessible
2. **No routes found**: Verify GTFS data covers your area and time period
3. **CORS errors**: Ensure OTP server allows cross-origin requests
4. **Timeout errors**: Check network connectivity and server performance

## Fallback Routing

When OTP is unavailable, the app automatically falls back to basic transit routing:

### Features

- Estimates transit routes using heuristics
- Combines walking + public transport segments
- Chooses between bus/metro based on distance
- Provides reasonable time estimates

### Limitations

- No real-time data
- No actual route schedules
- Simplified route geometry
- Less accurate than OTP

## Troubleshooting

### Check Environment Variables

```javascript
// In your app, you can check if OTP is configured:
const otpUrl = process.env.OTP_BASE_URL || process.env.EXPO_PUBLIC_OTP_BASE_URL;
console.log("OTP URL:", otpUrl || "Not configured");
```

### Enable Debug Logging

The transit router includes detailed logging. Check your console for messages like:

- `[TransitRouter] Planning transit route...`
- `[TransitRouter] OTP failed (...), using fallback`
- `[GeneratePlans] Planning transit route 1/2`

### Common Error Messages

| Error                       | Cause                         | Solution                                      |
| --------------------------- | ----------------------------- | --------------------------------------------- |
| "OTP server not configured" | Missing environment variables | Set OTP_BASE_URL or EXPO_PUBLIC_OTP_BASE_URL  |
| "OTP server error: 404"     | Wrong server URL or path      | Verify OTP server URL and router name         |
| "No transit routes found"   | No GTFS coverage              | Check if GTFS data covers your area           |
| "Network error"             | Connection issues             | Check internet connectivity and server status |

## Performance Tips

1. **Use appropriate timeouts**: The app uses 10-second timeouts for OTP requests
2. **Limit walking distance**: Default max walk distance is 1000m
3. **Cache results**: Consider implementing route caching for repeated requests
4. **Monitor server load**: High OTP server load can cause timeouts

## Development

### Testing Transit Routes

```javascript
import { planTransitRoute } from "./utils/transitRouter";

// Test a route
const result = await planTransitRoute(
  { lat: 44.4268, lon: 26.1025 }, // from
  { lat: 44.4378, lon: 26.0969 }, // to
  new Date(), // when
  1000, // max walk meters
);

console.log("Route result:", result);
```

### Adding New Transit APIs

To add support for other transit APIs:

1. Create a new function in `transitRouter.ts`
2. Follow the `TransitRouteResult` interface
3. Add it to the fallback chain in `planTransitRoute`

## Support

If you're still having issues:

1. Check the console logs for detailed error messages
2. Verify your OTP server is working with direct API calls
3. Test with the fallback routing to isolate OTP issues
4. Check network connectivity and firewall settings
