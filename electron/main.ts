import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;
const PORT = 3000;

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Log file for debugging
let logPath: string | null = null;
function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  if (logPath) {
    try {
      fs.appendFileSync(logPath, logMessage);
    } catch (e) {}
  }
}

// Loading HTML
const loadingHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuackTrack - Loading</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    .container { text-align: center; padding: 40px; }
    .logo { font-size: 48px; margin-bottom: 20px; }
    .title { font-size: 32px; font-weight: bold; margin-bottom: 10px; color: #fbbf24; }
    .subtitle { font-size: 16px; color: #888; margin-bottom: 40px; }
    .spinner {
      width: 50px; height: 50px;
      border: 4px solid #333;
      border-top-color: #fbbf24;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status { font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🦆</div>
    <div class="title">QuackTrack</div>
    <div class="subtitle">PTC Scheduling System</div>
    <div class="spinner"></div>
    <div class="status">Starting application...</div>
  </div>
</body>
</html>
`;

// Error HTML
const errorHTML = (message: string, details?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QuackTrack - Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; padding: 40px;
    }
    .container { text-align: center; max-width: 700px; width: 100%; }
    .logo { font-size: 48px; margin-bottom: 20px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; color: #ef4444; }
    .message {
      font-size: 13px; color: #aaa; background: #1a1a1a;
      padding: 20px; border-radius: 8px; text-align: left;
      font-family: monospace; white-space: pre-wrap; word-break: break-word;
      max-height: 300px; overflow-y: auto; width: 100%;
    }
    .details {
      font-size: 11px; color: #888; background: #151515;
      padding: 15px; border-radius: 8px; margin-top: 15px;
      text-align: left; font-family: monospace;
      max-height: 150px; overflow-y: auto; width: 100%;
    }
    .info { font-size: 12px; color: #666; margin-top: 20px; }
    .retry-btn {
      margin-top: 20px; padding: 10px 20px;
      background: #fbbf24; color: #000; border: none; border-radius: 6px;
      font-size: 14px; cursor: pointer;
    }
    .retry-btn:hover { background: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🦆</div>
    <div class="title">Startup Error</div>
    <div class="message">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${details ? `<div class="details">${details.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
    <div class="info">Log file: ${logPath || 'N/A'}<br>Try restarting the application.</div>
    <button class="retry-btn" onclick="location.reload()">Retry</button>
  </div>
</body>
</html>
`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'QuackTrack - PTC Scheduling System',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function loadApp() {
  if (!mainWindow) return;
  mainWindow.loadURL(`http://localhost:${PORT}`).catch((err) => {
    showError(`Connection failed: ${err.message}`);
  });
}

function showError(message: string, details?: string) {
  if (!mainWindow) return;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML(message, details))}`);
}

// Find standalone directory
function findStandaloneDir(): string | null {
  const possiblePaths = [
    path.join(process.resourcesPath, 'standalone'),
    path.join(__dirname, '..', '..', '.next', 'standalone'),
    path.join(process.cwd(), '.next', 'standalone'),
  ];

  log('Searching for standalone directory...');
  for (const p of possiblePaths) {
    const serverPath = path.join(p, 'server.js');
    try {
      if (fs.existsSync(serverPath)) {
        log(`Found standalone at: ${p}`);
        return p;
      }
    } catch (e) {
      log(`Error checking path ${p}: ${e}`);
    }
  }
  log('Standalone directory not found in any of the expected locations');
  return null;
}

// Load .env file and return contents
function loadEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key) {
          let value = vals.join('=').trim();
          value = value.replace(/^["']|["']$/g, '');
          env[key.trim()] = value;
        }
      }
    });
    log(`Loaded ${Object.keys(env).length} env vars from ${envPath}`);
  } catch (e) {
    log(`Error loading .env from ${envPath}: ${e}`);
  }
  return env;
}

// Find Prisma engines
function findPrismaEngines(standaloneDir: string): { queryEngine: string | null; schemaEngine: string | null } {
  const possiblePaths = [
    path.join(standaloneDir, 'node_modules', '@prisma', 'engines'),
    path.join(standaloneDir, 'node_modules', '.prisma', 'client'),
  ];
  
  for (const enginePath of possiblePaths) {
    try {
      if (fs.existsSync(enginePath)) {
        log(`Checking for engines in: ${enginePath}`);
        const files = fs.readdirSync(enginePath);
        log(`Files: ${files.filter(f => f.includes('query') || f.includes('schema')).join(', ')}`);
        
        // Look for query engine with underscore or hyphen
        const queryEngine = files.find(f => 
          (f.includes('query_engine') || f.includes('query-engine')) && 
          (f.endsWith('.exe') || f.endsWith('.node'))
        );
        // Look for schema engine
        const schemaEngine = files.find(f => 
          f.includes('schema-engine') && !f.includes('query')
        );
        
        if (queryEngine) {
          log(`Found query engine: ${path.join(enginePath, queryEngine)}`);
        }
        if (schemaEngine) {
          log(`Found schema engine: ${path.join(enginePath, schemaEngine)}`);
        }
        
        return {
          queryEngine: queryEngine ? path.join(enginePath, queryEngine) : null,
          schemaEngine: schemaEngine ? path.join(enginePath, schemaEngine) : null,
        };
      }
    } catch (e) {
      log(`Error checking engine path ${enginePath}: ${e}`);
    }
  }
  
  log('Prisma engines not found');
  return { queryEngine: null, schemaEngine: null };
}

// Start Next.js server
async function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      log('Development mode - assuming server is running');
      resolve();
      return;
    }

    log('Starting production server...');
    log(`Platform: ${process.platform}`);

    const standaloneDir = findStandaloneDir();
    if (!standaloneDir) {
      reject(new Error('Standalone server not found. The app may be corrupted.'));
      return;
    }

    const serverPath = path.join(standaloneDir, 'server.js');
    if (!fs.existsSync(serverPath)) {
      reject(new Error(`Server file missing: ${serverPath}`));
      return;
    }

    log(`Server path: ${serverPath}`);
    log(`Working dir: ${standaloneDir}`);
    
    // List directory contents
    try {
      const files = fs.readdirSync(standaloneDir);
      log(`Standalone files: ${files.join(', ')}`);
    } catch (e) {
      log(`Error listing directory: ${e}`);
    }

    // Load .env file
    const envPaths = [
      path.join(standaloneDir, '.env'),
      path.join(process.resourcesPath, '.env'),
    ];
    
    let envVars: Record<string, string> = {};
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        log(`Found .env at: ${envPath}`);
        envVars = loadEnvFile(envPath);
        break;
      }
    }

    // Find Prisma engines
    const engines = findPrismaEngines(standaloneDir);

    // Use Electron's executable as Node.js with ELECTRON_RUN_AS_NODE
    const execPath = process.execPath;
    log(`Using executable: ${execPath}`);

    // Build environment
    const env: Record<string, string> = {
      ...process.env,
      ...envVars,
      PORT: PORT.toString(),
      NODE_ENV: 'production',
      HOSTNAME: 'localhost',
      ELECTRON_RUN_AS_NODE: '1',
    } as Record<string, string>;

    // Set Prisma engine paths if found
    if (engines.queryEngine) {
      env.PRISMA_QUERY_ENGINE_BINARY = engines.queryEngine;
    }
    if (engines.schemaEngine) {
      env.PRISMA_SCHEMA_ENGINE_BINARY = engines.schemaEngine;
    }

    let stderrOutput = '';
    let stdoutOutput = '';
    let resolved = false;

    try {
      log(`Spawning: ${execPath} ${serverPath}`);
      nextServer = spawn(execPath, [serverPath], {
        cwd: standaloneDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      nextServer.stdout?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        stdoutOutput += msg + '\n';
        log(`[Server] ${msg}`);
        
        // If we see "Ready" in the output, the server is up!
        if (msg.includes('Ready') && !resolved) {
          resolved = true;
          log('Server reported ready via stdout!');
          // Give it a moment to actually bind to the port
          setTimeout(() => resolve(), 1000);
        }
      });

      nextServer.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        stderrOutput += msg + '\n';
        log(`[Server stderr] ${msg}`);
      });

      nextServer.on('error', (err: Error) => {
        log(`Spawn error: ${err.message}`);
        if (!resolved) {
          resolved = true;
          reject(new Error(`Failed to start server: ${err.message}`));
        }
      });

      nextServer.on('exit', (code: number | null, signal: string | null) => {
        log(`Server exited with code: ${code}, signal: ${signal}`);
        if (!resolved && code !== 0 && code !== null) {
          resolved = true;
          const errorMsg = stderrOutput || stdoutOutput || `Process exited with code ${code}`;
          reject(new Error(`Server crashed (code ${code})\n\n${errorMsg.slice(-500)}`));
        }
      });

    } catch (err) {
      log(`Failed to spawn: ${err}`);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
      return;
    }

    // Poll to check if server is responding
    const startTime = Date.now();
    const maxWaitTime = 90 * 1000; // 90 seconds max
    let checkInterval: NodeJS.Timeout | null = null;
    
    const checkServer = () => {
      if (resolved) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitTime) {
        resolved = true;
        if (checkInterval) clearInterval(checkInterval);
        const errorLogs = stderrOutput.slice(-300) || 'No error output captured';
        reject(new Error(`Server startup timeout after ${Math.round(elapsed/1000)}s\n\n${errorLogs}`));
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const http = require('http');
      const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'GET',
        timeout: 5000,
      }, (res: any) => {
        if (res.statusCode && res.statusCode < 500) {
          log(`Server responding with status ${res.statusCode}`);
          if (!resolved) {
            resolved = true;
            if (checkInterval) clearInterval(checkInterval);
            log(`Server ready! Total time: ${Math.round(elapsed/1000)}s`);
            resolve();
          }
        }
      });

      req.on('error', () => {
        // Server not ready yet, will retry
      });

      req.on('timeout', () => {
        req.destroy();
      });

      req.end();
    };

    // Start polling after 5 seconds, then every 1 second
    setTimeout(() => {
      if (!resolved) {
        checkServer();
        checkInterval = setInterval(checkServer, 1000);
      }
    }, 5000);
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Setup log file
  logPath = path.join(app.getPath('userData'), 'quacktrack-debug.log');
  
  // Clear previous log
  try {
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  } catch (e) {}
  
  log('=== QuackTrack Starting ===');
  log(`Version: ${app.getVersion()}`);
  log(`isDev: ${isDev}`);
  log(`isPackaged: ${app.isPackaged}`);
  log(`resourcesPath: ${process.resourcesPath}`);
  log(`execPath: ${process.execPath}`);
  log(`userData: ${app.getPath('userData')}`);
  log(`Log file: ${logPath}`);
  log('============================');

  createWindow();

  try {
    if (!isDev) await startNextServer();
    loadApp();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        if (!isDev) {
          startNextServer().then(loadApp).catch((err) => showError(err.message));
        } else {
          loadApp();
        }
      }
    });
  } catch (error) {
    log(`Startup error: ${error}`);
    showError(`${error}`);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServer) nextServer.kill();
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextServer) nextServer.kill();
});

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('show-open-dialog', async (_, options) => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  return dialog.showOpenDialog(mainWindow, options);
});
ipcMain.handle('show-save-dialog', async (_, options) => {
  if (!mainWindow) return { canceled: true, filePath: undefined };
  return dialog.showSaveDialog(mainWindow, options);
});
ipcMain.handle('open-external', async (_, url: string) => {
  await shell.openExternal(url);
});
