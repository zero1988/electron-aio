const {
    v4
} = require('uuid')

const axios = require('axios')
const file = require('./file')
const fs = require('fs')
const path = require('path')


window.FileUploadResult = function () {
    this.bytesSent = 0
    this.responseCode = 0
    this.response = ''
    this.objectId = ''
}

window.PluginResult = function () {
    this.status = 0
    this.strMessage = ''
    this.encodedMessage = ''
}

window.STATUS = {
    NO_RESULT: 0,
    OK: 1,
    CLASS_NOT_FOUND_EXCEPTION: 2,
    ILLEGAL_ACCESS_EXCEPTION: 3,
    INSTANTIATION_EXCEPTION: 4,
    MALFORMED_URL_EXCEPTION: 5,
    IO_EXCEPTION: 6,
    INVALID_ACTION: 7,
    JSON_EXCEPTION: 8,
    ERROR: 9
}

window.FileProgressResult = function () {
    this.lengthComputable = false
    this.loaded = 0
    this.total = 0
}

window.Handle = {

    BOUNDARY_PREFIX: "+++++",
    LINE_START: "--",
    LINE_END: '\r\n',

    FILE_NOT_FOUND_ERR: 1,
    INVALID_URL_ERR: 2,
    CONNECTION_ERR: 3,
    ABORTED_ERR: 4,
    NOT_MODIFIED_ERR: 5,

    MAX_BUFFER_SIZE: 8 * 1024,

    upload(args, success) {
        const me = this
        var source = args[0]
        var target = args[1]
        var fileKey = args[2] ? args[2] : 'file'
        var fileName = args[3] ? args[3] : 'image.jpg'
        var mimeType = args[4] ? args[4] : 'image/jpeg'
        var parameters = args[5] ? args[5] : {} // todo...
        var chunkedMode = args[7] ? args[7] : true
        var headers = args[8] // todo...
        var objectId = args[9]
        var httpMethod = args[10] ? args[10] : "POST"


        var BOUNDARY = me.BOUNDARY_PREFIX + v4()


        //! todo... parameters
        // JObject parameters = (args[5] == null ? new JObject() : args[5].Value < JObject > ());


        // JObject headers = args[8].Value < JObject > ();
        // if (headers == null && parameters != null) {
        //     headers = parameters.Value < JObject > ("headers");
        // }

        var totalBytes = 0
        var fixedLength = -1

        var result = new FileUploadResult()
        var progress = new FileProgressResult()



        var useHttps = source.toLowerCase().startsWith('https://')
        const agent = new https.Agent({
            rejectUnauthorized: false
        })

        var options = {
            url: target,
            method: httpMethod,
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            oneUploadProgress: function (progressEvent) {
                progress.lengthComputable = progressEvent.lengthComputable
                progress.loaded = progressEvent.loaded
                progress.total = progressEvent.total
                success(JSON.stringify(progress))
            },

        }

        if (useHttps) {
            options.agent = agent
        }

        axios(options).then(function (response) {

        })

        var beforeData = ''
        beforeData += me.LINE_START + me.BOUNDARY + me.LINE_END
        beforeData += 'Content-Disposition: form-data; name="' + key + '";'
        beforeData += ' filename="' + fileName + '"' + me.LINE_END
        beforeData += 'Content-Type: ' + mimeType + me.LINE_END + me.LINE_END

        var beforeDataBytes = Buffer.from(beforeData, 'utf8')
        var tailParamsBytes = Buffer.from(me.LINE_END + me.LINE_START + me.BOUNDARY + me.LINE_START + me.LINE_END, 'utf8')

        var stringLength = beforeDataBytes.length + tailParamsBytes.length
        var size = fs.statSync(source).size
        if (size >= 0) {
            fixedLength = size
            if (multipartFormUpload)
                fixedLength += stringLength
            progress.lengthComputable = true
            progress.total = fixedLength
        }

    },
    download(args, success) {
        var source = args[0]
        var target = args[1]
        var objectId = args[3]


        var result = new PluginResult()
        var progress = new FileProgressResult()

        var options = {
            url: source,
            method: 'GET',
            responseType: 'blob', // blob, stream, text, json, document, arraybuffer
            onDownloadProgress: function (progressEvent) {

                progress.loaded = progressEvent.loaded
                result = {
                    status: STATUS.OK,
                    encodedMessage: JSON.stringify(progress)
                }
                success(JSON.stringify(result))
            },
        }
        target = this.normalizeURL(target)

        axios(options).then(function (response) {
            var blob = response.data
            var reader = new FileReader()
            reader.onload = function () {
                var buffer = Buffer.from(reader.result)
                fs.writeFile(target, buffer, 'binary', () => {
                    result = {
                        status: STATUS.OK,
                        encodedMessage: JSON.stringify(file.getEntryByURL(target))
                    }
                    success(JSON.stringify(result))
                })
            }
            reader.readAsArrayBuffer(blob)
        })

    },
    normalizeURL(url) {
        url = url.replace(/^localfile:\/\/\//ig, '')
            .replace(/^localfile:\/\//ig, '')
            .replace(/^file:\/\/\//ig, '')
            .replace(/^file:\/\//ig, '')
            .replace(/\/\//ig, '/')
        url = path.normalize(url)
        return url
    },

    abort(args, success) {

    }
}

window.fileTransfer = {
    exec(success, error, plugin, func, args) {
        window.Handle[func](args, success)
    }
}

module.exports = window.fileTransfer