const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = !app.isPackaged;
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

// Get the app data directory
const getAppDataPath = () => {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA, 'telugu-trader-mindset');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'telugu-trader-mindset');
  } else {
    return path.join(os.homedir(), '.config', 'telugu-trader-mindset');
  }
};

// Ensure app data directory exists
const appDataPath = getAppDataPath();
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

// Save trades to file
ipcMain.handle('save-trades', async (event, trades) => {
  try {
    const tradesPath = path.join(appDataPath, 'trades.json');
    fs.writeFileSync(tradesPath, JSON.stringify(trades, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving trades:', error);
    return { success: false, error: error.message };
  }
});

// Load trades from file
ipcMain.handle('load-trades', async (event) => {
  try {
    const tradesPath = path.join(appDataPath, 'trades.json');
    if (fs.existsSync(tradesPath)) {
      const data = fs.readFileSync(tradesPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading trades:', error);
    return [];
  }
});

// Backup trades
ipcMain.handle('backup-trades', async (event, trades) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(appDataPath, `backup-trades-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(trades, null, 2));
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Error backing up trades:', error);
    return { success: false, error: error.message };
  }
});

// Get app data directory path (for user reference)
ipcMain.handle('get-app-data-path', async (event) => {
  return appDataPath;
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'icon.png'), // Add your icon here
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Keyboard shortcuts
const { Menu } = require('electron');

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => {
          require('electron').dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Telugu Trader Mindset',
            message: 'Professional Trading Journal v2.0',
            detail: 'Track, analyze, and improve your trading performance.\n\nAll data stored locally on your computer.',
          });
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
