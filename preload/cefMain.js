const path = require('path')
const fs = require('fs')
const RSA = require('node-rsa')
const M = require('./M')
const Cache = require('./Cache')


window.cefMain = {
    writeLogError(msg) {
        console.error(msg)
    },
    getAccountName() {
        var configPath = path.join(__dirname, '../config.json')
        var jsonStr = fs.readFileSync(configPath, 'utf8')
        var config = JSON.parse(jsonStr)
        if (config.IsDemo === 'Y') {
            return config.DemoRouteUrl
        } else {
            return config.RouteUrl
        }
    },
    getCurrentRouteConfigJsonStr() {
        var configPath = path.join(__dirname, '../config.json')
        var jsonStr = fs.readFileSync(configPath, 'utf8')
        return jsonStr
    },
    getRouteConfigJsonStr() {
        var config = {
            RouteList: [{
                RouteID: 1,
                RouteUrl: 'https://im.aio7.com/'
            }, {
                RouteID: 2,
                RouteUrl: 'http://www.aio7.com:7001'
            }],
            DemoRouteList: [{
                RouteID: 1,
                RouteUrl: 'http://218.4.111.6:17001'
            }]
        }
        return JSON.stringify(config)
    },
    getLoginConfigJsonStr() {
        var configPath = path.join(__dirname, '../config.json')
        var jsonStr = fs.readFileSync(configPath, 'utf8')
        return jsonStr
    },
    isLogin() {
        //! todo...
        return false
    },
    setUserInfo(userInfo) {
        // todo...  
        M.CurrentUser = userInfo
        // todo... 加载个人设置
        // todo... 设置登录成功
    },
    checkVersion() {
        return 'true|1.0.39.497'
    },
    logout(callback) {
        callback()
    },
    getDeviceID() {
        // todo...  MD5(mac address)
        return '123456789'
    },
    getEncryptPassword(_, password) {
        const publicKey =
            '-----BEGIN PUBLIC KEY-----\n' +
            'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDOCcYEgKyE/3IVysNo+lI/JdaK\n' +
            '/olvVLWx9lDrG2PTbx9iPlnP8DB4AX2g9ATk0hWUzXjZ0xhqvN1onj1/oRneaq4Z\n' +
            '8/O7LHGxOzuKc2KbIkZM8dxfGIoHuR4flzhvanmbRicqIH8j5i9ZBP2vkXMREW5i\n' +
            'h/Cuqo8HidWmNoBZNwIDAQAB\n' +
            '-----END PUBLIC KEY-----'
        const rsa = new RSA(publicKey, 'pkcs8-public', {
            encryptionScheme: 'pkcs1'
        })
        return rsa.encrypt(password, 'base64')
    },
    addLogin(userId, password, token, userName, callback) {
        var configPath = path.join(__dirname, '../config.json')
        var jsonStr = fs.readFileSync(configPath, 'utf8')
        var config = JSON.parse(jsonStr)
        var loginInfo = {
            UserID: userId,
            Password: password,
            Token: token,
            UserName: userName
        }

        config.CurrentAccount.User = loginInfo
        if (config.IsDemo !== 'Y') {
            var accountId = config.CurrentAccount.AccountID
            config.AccountList.forEach(ac => {
                if (ac.AccountID === accountId) {
                    ac.User = loginInfo
                }
            })
        } else {
            config.DemoAccount.User = loginInfo
        }

        fs.writeFileSync(configPath, JSON.stringify(config), 'utf8')

        callback('true|添加登录信息成功')
    },
    setWholeRest(isRest) {
        M.IsWholeReset = isRest
    },
    getWholeRest() {
        return M.IsWholeReset
    },
    removeLogin(callback) {

        var configPath = path.join(__dirname, '../config.json')
        var jsonStr = fs.readFileSync(configPath, 'utf8')
        var config = JSON.parse(jsonStr)
        config.CurrentAccount.User.Token = ''
        if (config.IsDemo !== 'Y') {
            var accountId = config.CurrentAccount.AccountID
            config.AccountList.forEach(ac => {
                if (ac.AccountID === accountId) {
                    ac.User.Token = ''
                }
            })
        } else {
            config.DemoAccount.User.Token = ''
        }

        fs.writeFileSync(configPath, JSON.stringify(config), 'utf8')

        callback('true|移除登录信息成功')

    }
}

module.exports = window.cefMain