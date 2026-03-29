# Building QuackTrack Android APK

## Important: Authentication Fix

The mobile app **must load from the server URL** for authentication to work. This is because:
- NextAuth uses cookies for session management
- Cookies don't work with `file://` protocol (local files)
- The app loads from `https://quacktrack-dsvr.onrender.com` in a WebView

## Build Steps

### Step 1: Build and Sync
```powershell
bun run mobile:build
```

### Step 2: Build APK
```powershell
cd android
.\gradlew assembleDebug
```

### Step 3: Install APK
```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

## How It Works

| Component | Source |
|-----------|--------|
| **UI/HTML** | Loaded from server (WebView) |
| **Authentication** | Works via cookies (same as web) |
| **Database** | PostgreSQL on Render |
| **API Calls** | Direct to server |

## Why This Approach?

This WebView approach ensures:
- ✅ Login works (cookies supported)
- ✅ Session persistence
- ✅ Always up-to-date (no app updates needed for UI changes)
- ✅ Full feature parity with web version

## APK Location

```
android\app\build\outputs\apk\debug\app-debug.apk
```

## Requirements

- Internet connection required (app loads from server)
- Java JDK 17 or 21
- Android SDK

## Troubleshooting

### White screen after login
- Check internet connection
- Verify server is running at https://quacktrack-dsvr.onrender.com

### Login fails
- Make sure server CORS is configured (already deployed)
- Check server logs on Render

### App won't install
- Enable "Install from unknown sources" in Android settings
- Make sure USB debugging is enabled
