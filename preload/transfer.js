const {
    v4
} = require('uuid')

const axios = require('axios')
const file = require('./file')
const fs = require('fs')
const path = require('path')
const request = require('request')


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
    upload(args, success) {
        var source = args[0]
        var target = args[1]
        var parameters = args[5]

        var result = new FileUploadResult()
        var progress = new FileProgressResult()

        var formData = {}
        for (var key in parameters) {
            formData[key] = parameters[key]
        }
        formData['files'] = {
            value: fs.createReadStream(source),
            options: {
                filename: path.basename(source),
            }
        }

        var options = {
            method: 'POST',
            url: target,
            formData
        };
        request(options, function (err, response) {
            if (err) {
                result = {
                    status: STATUS.ERROR,
                    encodedMessage: JSON.stringify({
                        responseCode: response.statusCode,
                        response: err.ERROR()
                    })
                }
            } else {
                result = {
                    status: STATUS.OK,
                    encodedMessage: JSON.stringify({
                        responseCode: response.statusCode,
                        response: response.body
                    })
                }
            }
            success(JSON.stringify(result))
        });


        // for (var key in parameters) {
        //     data.append(key, parameters[key])
        // }

        // data.getLength(function (err, length) {

        // if (err)
        //     return
        // var headers = data.getHeaders()
        // headers['content-length'] = length

        // var data = new FormData();
        // var rs = fs.createReadStream(source)
        // rs.on('end', function () {
        //     console.log('end')
        //     data.append('files', rs);
        //     data.append('chat_id', parameters.chat_id);
        //     data.append('client_ids', parameters.client_ids);
        //     data.append('file_id', parameters.file_id);
        //     data.append('is_origins', 'Y');
        //     var headers = data.headers
        //     var config = {
        //         method: 'post',
        //         url: target,
        //         data: data,
        //         headers
        //     };

        //     axios(config)
        //         .then(function (response) {
        //             console.log(JSON.stringify(response.data));
        //         })
        //         .catch(function (error) {
        //             console.log(error);
        //         });




        // }).on('data', function () {
        //     console.log('data')
        // })


        // axios({
        //     url: target,
        //     data: data,
        //     method: 'post',
        //     headers: {
        //         'Content-Type': 'multipart/form-data',
        //         ...data.getHeaders()
        //     },
        //     oneUploadProgress: function (progressEvent) {
        //         progress.lengthComputable = progressEvent.lengthComputable
        //         progress.loaded = progressEvent.loaded
        //         progress.total = progressEvent.total
        //         result = {
        //             status: STATUS.OK,
        //             encodedMessage: JSON.stringify(progress),
        //         }
        //         success(JSON.stringify(result))
        //     },
        // }).then(function (response) {
        //     result = {
        //         status: STATUS.OK,
        //         encodedMessage: JSON.stringify({
        //             responseCode: response.status,
        //             response: response.data
        //         })
        //     }
        //     success(JSON.stringify(result))


        // }).catch(function (error) {
        //     console.log(error)
        // })

    },
    download(args, success) {
        var source = args[0]
        var target = args[1]

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