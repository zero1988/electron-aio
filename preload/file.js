const path = require('path')
const fs = require('fs')

window.FileSystemURL = function (url, fsname, fspath, directory) {
    this.url = url
    this.fsname = fsname
    this.fspath = fspath
    this.directory = directory
}

window.FileSystemURL.parse = function (url) {

    var fspath = url.replace(/^localfile:\/\/\//ig, '')
        .replace(/^localfile:\/\//ig, '')
        .replace(/^file:\/\/\//ig, '')
        .replace(/^file:\/\//ig, '')
        .replace(/\/\//ig, '/')
    url = 'file:///' + fspath
    var isDirectory = fs.existsSync(fspath) &&
        fs.statSync(fspath).isDirectory()
    return new FileSystemURL(url, '', fspath, isDirectory)

}

window.file = {
    exec(success, error, plugin, func, args) {
        console.log('file.exec', plugin, func, args)
        file[func](args, success, error)
    },
    testSaveLocationExists(success) {
        var dir = path.join(__dirname, '../data/')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
            success(true)
        }
    },
    getFreeDiskSpace(success) {
        if (process.platform !== 'darwin') {
            const diskinfo = require('diskinfo')
            var disk = __dirname.substr(0, 2).toLowerCase()
            diskInfo.getDrives((_, drives) => {
                drives.some(drive => {
                    if (drive.mount === disk) {
                        success(drive.available)
                        return true
                    }
                })
            })
        } else {
            success(2000000000)
        }
    },
    testFileExists(args, success) {
        var filename = args[0]
        success(fs.existsSync(filename))
    },
    testDirectoryExists(args, success) {
        var dirname = args[0]
        success(fs.existsSync(dirname))
    },
    readAsText(args, success) {
        var filename = args[0]
        var encoding = args[1]
        file.readFileAs({
            filename: filename,
            encoding: encoding,
            type: 0
        }, success)
    },
    readAsDataURL(args, success) {
        var filename = args[0]
        file.readFileAs({
            filename: filename,
            encoding: 'utf8',
            type: -1
        }, success)
    },
    readAsArrayBuffer(args, success) {
        var filename = args[0]
        var start = args[1]
        var end = args[2]
        file.readFileAs({
            filename: filename,
            encoding: 'utf8',
            start: start,
            end: end,
            type: 1
        }, success)
    },
    readAsBinaryString(args, success) {
        var filename = args[0]
        var start = args[1]
        var end = args[2]
        file.readFileAs({
            filename: filename,
            encoding: 'utf8',
            start: start,
            end: end,
            type: 2
        }, success)
    },
    write(args, success) {
        var filename = args[0]
        var data = args[1]
        var offset = args[2]
        var isBinary = args[3]
        var rawData, targetData
        if (isBinary) {
            rawData = Buffer.from(data, 'base64')
        } else {
            rawData = Buffer.from(data, 'utf8')
        }
        rawData.copy(targetData, 0, offset, rawData.length - 1)
        success(fs.writeFileSync(filename, targetData))
    },
    truncate(args, success) {
        var filename = args[0]
        var offset = args[1]

        //! todo
        success('')
    },
    requestAllFileSystem(args, success) {
        var entry = this.getRootEntry()
        success(JSON.stringify(entry))
    },
    requestAllPaths(success) {
        success(JSON.stringify({}))
    },
    requestFileSystem(args, success) {
        var type = args[0]
        var requiredSize = args[1]
        file.requestFileSystem(type, requiredSize, success)
    },
    resolveLocalFileSystemURI(args, success) {
        var filename = args[0]
        var inputURL = FileSystemURL.parse(filename)
        var entry = file.getEntry(inputURL)
        success(JSON.stringify(entry))
    },
    getFileMetadata(args, success) {
        var filename = args[0]
        var inputURL = FileSystemURL.parse(filename)
        var metaData = {}
        if (fs.existsSync(inputURL.fspath)) {
            var state = fs.statSync(inputURL.fspath)
            metaData = {
                size: state.size,
                type: path.extname(inputURL.fspath), //! 转换MIME类型
                name: path.basename(inputURL.fspath),
                fullPath: inputURL.fspath,
                lastModifiedDate: state.mtime.toISOString()
            }
        }
        success(JSON.stringify(metaData))
    },
    getParent(args, success) {
        var filename = args[0]
        var parent = path.resolve(filename, '..')
        var entry = file.getEntry(parent)
        success(JSON.stringify(entry))
    },
    getDirectory(args, success, error) {
        var dirname = args[0]
        var pathname = args[1]
        var options = args[2]
        try {
            var dir = file.getDirectoryOrFile(dirname, pathname, options, true)
            success(JSON.stringify(dir))
        } catch {
            error(1)
        }
    },
    getFile(args, success, error) {
        var dirname = args[0]
        var pathname = args[1]
        var options = args[2]
        try {
            var f = file.getDirectoryOrFile(dirname, pathname, options, false)
            success(JSON.stringify(f))
        } catch {
            error(1)
        }
    },
    remove(args, success) {
        var filename = args[0]
        file.removeDirectoryOrFile(filename, false)
        success()
    },
    removeRecursively(args, success) {
        var filename = args[0]
        file.removeDirectoryOrFile(filename, true)
        success()
    },
    moveTo(args, success) {
        var filename = args[0]
        var newdir = args[1]
        var newname = args[2]
        var entry = this.transferTo(filename, newdir, newname, true)
        success(JSON.stringify(entry))
    },
    copyTo(args, success) {
        var filename = args[0]
        var newDir = args[1]
        var newname = args[2]
        var entry = this.transferTo(filename, newDir, newname, false)
        success(JSON.stringify(entry))
    },
    readEntries(args, success) {
        var filename = args[0]
        if (filename === '/' || filename === '\\' || filename === '') {
            filename = path.join(__dirname, '../data/')
        }

        if (!fs.existsSync(filename)) {
            error(`${filename} not exists`)
        } else {
            var entries = []
            fs.readdirSync(filename).forEach(dir => {
                var entry = this.getEntry(FileSystemURL.parse(path.join(filename, dir)))
                entries.push(entry)
            })
            success(JSON.stringify(entries))
        }
    },
    _getLocalFilesystemPath(args, success) {
        success('')
    },

    /** 私有方法 */
    transferTo(src, dest, newname, move) {
        var srcURL = FileSystemURL.parse(src)
        var destURL = FileSystemURL.parse(dest)

        if (!fs.existsSync(srcURL.fspath)) {
            fs.mkdirSync(destURL.fspath)
        }

        var destFilename = path.join(destURL.fspath, newname)

        if (move) {
            fs.renameSync(srcURL.fspath, destFilename)
        } else {
            fs.copyFileSync(srcURL.fspath, destFilename)
        }

        var newURLStr = path.join(destURL.fspath, newname)
        return file.getEntry(FileSystemURL.parse(newURLStr))

    },
    removeDirectoryOrFile(baseURLStr, recursive) {
        var inputURL = FileSystemURL.parse(baseURLStr)
        var fullPath = inputURL.fspath
        fs.rmSync(fullPath, {
            force: true,
            recursive: recursive
        })

    },
    getDirectoryOrFile(baseURLStr, filename, options, directory) {

        if (baseURLStr === '/' || baseURLStr === '\\' || baseURLStr === '')
            baseURLStr = path.join(__dirname, '../data/')

        var create = false
        var exclusive = false

        if (options) {
            create = options.create
            if (create)
                exclusive = options.exclusive
        }

        if (directory && (!filename.endsWith('\\') || !filename.endsWith('/')) && !filename)
            path += "\\"

        var tmpPath = path.join(baseURLStr, filename)
        var requestedURL = FileSystemURL.parse(tmpPath)
        var fullPath = requestedURL.fspath
        if (create) {
            if (!fs.existsSync(fullPath)) {
                if (directory)
                    fs.mkdirSync(fullPath)
                else
                    fs.writeFileSync(fullPath, '')
            }
        }
        if (!fs.existsSync(fullPath)) {
            throw new Error(`${fullPath} not exists`)
        }

        return file.getEntry(requestedURL);
    },
    getRootEntry() {
        var fsURL = new FileSystemURL('')
        return file.getEntry(fsURL)
    },
    getEntryByURL(url) {
        var inputURL = FileSystemURL.parse(url)
        return file.getEntry(inputURL)
    },
    getEntry(inputURL) {
        var fname = ''
        if (inputURL.fspath) {
            var end = inputURL.fspath.endsWith('\\') ? 1 : 0
            var parts = inputURL.fspath.substr(0, inputURL.fspath.length - end).split('\\')
            if (parts.length > 1) {
                fname = parts[parts.length - 1]
            }
        }

        var nativeURL = 'file:///' + inputURL.fspath
        if (inputURL.directory && !nativeURL.endsWith('\\'))
            nativeURL += '\\'
        nativeURL = nativeURL.replace(/\\/ig, '/')

        return {
            isFile: !inputURL.directory,
            isDirectory: inputURL.directory,
            name: fname,
            fullPath: inputURL.fspath,
            filesystemName: inputURL.fsname,
            filesystem: 'temporary' === inputURL.fsname ? 0 : 1,
            nativeURL: nativeURL
        }
    },
    requestFileSystem(size, success) {
        var availableSize = 0
        if (size > 0) {
            availableSize = 100 * 1024 * 1024
        }
        if (availableSize < size) {
            success('')
        } else {
            success({
                name: '',
                root: this.getRootEntry()
            })
        }
    },
    readFileAs(success, options) {
        var buffers = fs.readFileSync(options.filename, {
            encoding: options.encoding ? options.encoding : 'utf8'
        })

        switch (type) {
            case 0:
                success(buffers.toString())
                break
            case 1:
                success(buffers)
                break
            case 2:
                break
            default:
                success('data:' + path.extname(options.filename) + ';base64,' + buffers.toString('base64'))
                break
        }
    }
}

module.exports = window.file