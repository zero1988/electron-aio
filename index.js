const {
    app,
    BrowserWindow,
    protocol,
    ipcMain,
    dialog
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

ipcMain.on('select-images', (event, _) => {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: '选择图片',
        filters: [{
            name: 'Images',
            extensions: ['jpg', 'png', 'gif', 'bmp']
        }],
        properties: ['openFile', 'multiSelections'],
        message: '选择图片' // macOS用
    }).then(result => {
        event.reply('select-images-reply', result)
    })
})