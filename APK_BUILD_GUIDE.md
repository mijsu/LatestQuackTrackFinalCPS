# Building the QuackTrack Android APK

## Prerequisites (Windows)

Before building, install these on your Windows machine:

### 1. Java JDK 17 or 21
Download from: https://adoptium.net/ (Temurin JDK)
- Install JDK 17 or 21 (LTS versions)
- After installation, verify:
  ```cmd
  java -version
  javac -version
  ```

### 2. Android Studio (recommended) or Android SDK Command Line Tools
Download from: https://developer.android.com/studio

After installing Android Studio:
- Open it once to complete setup
- It will download the Android SDK automatically

### 3. Set Environment Variables
Create these system environment variables:

| Variable | Value |
|----------|-------|
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot` (or your JDK path) |
| `ANDROID_HOME` | `C:\Users\YourName\AppData\Local\Android\Sdk` |

Add to PATH:
- `%JAVA_HOME%\bin`
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\tools`

---

## Build Steps (On Windows)

Open PowerShell in your project folder and run:

```powershell
# 1. Install dependencies (if not already)
bun install

# 2. Sync Capacitor with the deployed Next.js URL
bunx cap sync android

# 3. Build the APK
cd android
.\gradlew assembleDebug
```

The APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## Alternative: Build with Android Studio

1. Open Android Studio
2. Select "Open an Existing Project"
3. Navigate to your project's `android` folder
4. Wait for Gradle sync to complete
5. Go to Build → Build Bundle(s) / APK(s) → Build APK(s)

---

## Configuration Summary

Your mobile app is configured to connect to:
- **Next.js Server**: https://quacktrack-dsvr.onrender.com
- **Database**: PostgreSQL on Render
- **App ID**: com.ptc.quacktrack

---

## Troubleshooting

### "SDK location not found"
Create file `android/local.properties`:
```
sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

### "JAVA_HOME not found"
Set JAVA_HOME environment variable to your JDK installation path.

### Gradle permission denied
Run in PowerShell as Administrator, or run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Install APK on Android Device

1. Transfer `app-debug.apk` to your Android device
2. Open the file on your device
3. Allow installation from unknown sources if prompted
4. Install and enjoy!

Note: For Play Store release, you need to build a signed APK with:
```powershell
.\gradlew assembleRelease
```
