const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { exec } = require('child_process')

const isDev = !app.isPackaged
let mainWindow
let nextProcess

function startNextDev() {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next')
    nextProcess = exec(`"${nextBin}" dev --port 3000`, { cwd: __dirname })
    
    let started = false
    nextProcess.stdout.on('data', (data) => {
      const output = data.toString()
      if (!started && (output.includes('Ready') || output.includes('localhost:3000'))) {
        started = true
        resolve()
      }
    })
    
    nextProcess.stderr.on('data', (data) => {
      const output = data.toString()
      if (!started && (output.includes('Ready') || output.includes('localhost:3000'))) {
        started = true
        resolve()
      }
    })
    
    nextProcess.on('error', reject)
    
    setTimeout(() => {
      if (!started) {
        started = true
        resolve()
      }
    }, 10000)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Zynvera',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#FEFBF6',
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const PORT = 3456
    const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js')
    const fs = require('fs')

    if (fs.existsSync(serverPath)) {
      process.env.PORT = PORT
      process.env.HOSTNAME = '127.0.0.1'
      try {
        require(serverPath)
        setTimeout(() => {
          mainWindow.loadURL(`http://127.0.0.1:${PORT}`)
        }, 2000)
      } catch (err) {
        console.error('Failed to start standalone server:', err)
        loadErrorPage('Server Error: ' + err.message)
      }
    } else {
      console.error('Standalone server not found. Run: npm run build')
      loadErrorPage(
        'Build Required',
        '<h2>Production build not found</h2>' +
        '<p>Please run <code>npm run build</code> first, then relaunch the app.</p>' +
        '<p>Or run in development mode with <code>npm run electron:dev</code></p>'
      )
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function loadErrorPage(title, body) {
  const html = `<!DOCTYPE html>
<html><head><title>Zynvera - Error</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; color: #333; }
  .container { text-align: center; padding: 40px; max-width: 500px; }
  h1 { font-size: 48px; margin-bottom: 16px; }
  p { font-size: 16px; line-height: 1.6; color: #666; }
  code { background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  a { color: #0066cc; }
</style></head>
<body><div class="container">
  <h1>⚠️</h1>
  <h2>${title || 'Failed to start server'}</h2>
  ${body || '<p>The Next.js server could not be started. Check the console for details.</p>'}
</div></body></html>`
  mainWindow.loadURL('data:text/html,' + encodeURIComponent(html))
}

app.whenReady().then(async () => {
  if (isDev) {
    try {
      await startNextDev()
    } catch (err) {
      console.error('Failed to start Next.js dev server:', err)
    }
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
})
