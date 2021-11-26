const {
    app,
    BrowserWindow,
    protocol
} = require('electron')

path = require('path')



let win = null
const createWindow = () => {

    win = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: 'AIO',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // webSecurity: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile(path.join(__dirname, 'html/main/index.html'))

}

app.whenReady().then(() => {

    console.log('ready')
    protocol.registerFileProtocol('localfile', (request, callback) => {
        var url = request.url.substr(13)
        if (url.indexOf('?') !== -1) {
            url = url.substr(0, url.indexOf('?'))
        }
        if (process.platform === 'win32') {
            url = url.replace(/\//g, '\\')
        } else {
            url = url.replace(/\\/g, '/')
        }
        callback({
            path: path.normalize(url)
        })
    })

    createWindow()
    win.webContents.openDevTools()

})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})