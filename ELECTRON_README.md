# QuackTrack Desktop App - Standalone Installer

This project can be built as a **fully standalone desktop application** that you can send to users. They just install and use it - no Node.js or other dependencies needed!

## Quick Start

### Build for Windows:
```bash
bun run dist:win
```

This creates an installer in the `release/` folder that you can send to anyone.

---

## How It Works

The desktop app:
1. **Bundles everything** - Node.js runtime, Next.js server, database client, all dependencies
2. **Connects to your database** - Uses your PostgreSQL database on Render
3. **Just works** - Users install and run, no configuration needed

---

## Building the Desktop App

### Prerequisites (only on YOUR machine):
- Windows 10/11 (for building Windows app)
- Node.js 18+ or Bun installed
- All project dependencies installed

### Build Commands:

| Command | Output |
|---------|--------|
| `bun run dist:win` | Windows installer (.exe) |
| `bun run dist:mac` | macOS app (.dmg) |
| `bun run dist:linux` | Linux app (.AppImage, .deb) |

### What Gets Created:

**For Windows (`release/` folder):**
```
release/
├── QuackTrack Setup 1.0.0.exe    # Full installer
└── QuackTrack 1.0.0.exe          # Portable (no install needed)
```

---

## Distribution

### Option 1: Full Installer
- Send `QuackTrack Setup 1.0.0.exe`
- User runs it, installs like any Windows program
- Creates desktop shortcut and start menu entry

### Option 2: Portable Version
- Send `QuackTrack 1.0.0.exe`
- User just double-clicks and runs
- No installation required
- Can be run from USB drive

---

## User Requirements

The target desktop needs:
- ✅ **Windows 10/11** (for Windows build)
- ✅ **Internet connection** (to connect to database)
- ❌ **NO Node.js needed** - bundled in the app
- ❌ **NO other dependencies** - completely standalone

---

## Database Connection

The app connects to your PostgreSQL database using the `.env` file:
```
DATABASE_URL=postgresql://ptc_user:***@dpg-d6rairnkijhs73birf9g-a.oregon-postgres.render.com/quacktrack_6u94
```

This connection string is bundled with the app, so all users share the same data.

---

## Troubleshooting Build Issues

### Error: "@prisma/client did not initialize"
```bash
bun run db:generate
bun run dist:win
```

### Error: "Cannot find module"
```bash
bun install
bun run dist:win
```

### Build is slow
First build takes longer (downloads Electron binaries). Subsequent builds are faster.

---

## Development Mode

To test the desktop app during development:
```bash
bun run electron:dev
```

This starts the Next.js dev server and opens the Electron window.

---

## Files Structure

```
project/
├── electron/
│   ├── main.ts          # Electron main process
│   ├── preload.ts       # Preload script
│   └── tsconfig.json    # TypeScript config
├── build/               # Build resources (icons, etc.)
├── release/             # Output - installers go here
├── .next/standalone/    # Next.js standalone build
├── .env                 # Database config (bundled)
└── package.json         # Build configuration
```

---

## Updating the App

1. Make your code changes
2. Run `bun run dist:win` again
3. Send the new installer to users
4. They install over the old version

---

## Security Notes

- The `.env` file with database credentials is bundled in the app
- Consider using environment-specific database users with limited permissions
- For production, you may want to use a dedicated database user for the desktop app

---

## Support

For issues with the desktop app:
1. Check internet connection
2. Verify database is accessible (Render free tier may sleep)
3. Check Windows Firewall settings
