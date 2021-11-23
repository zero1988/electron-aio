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
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile(path.join(__dirname, 'html/main/index.html'))

}

app.whenReady().then(() => {
    protocol.registerFileProtocol('localfile', (request, callback) => {
        const url = request.url.substr(11)
        callback({
            path: path.normalize(`${__dirname}/${url}`)
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