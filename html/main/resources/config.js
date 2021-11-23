/*
 * 一些全局变量
 */
window.Config = {
    hasCon: true,
    version: 'v1.0.0',
    minVersion: '1.0.0', // 服务器端允许的最低版本

    appID: 'AIO8Pro',

    httpPdcGoUrl: 'https://im.pusherp.com/api/v1/',      // 演示账套
    wsPdcUrl: 'wss://im.pusherp.com/api/v1/websocket',   // 演示账套

    upgradeUrl: 'https://dl.pushsoft.cn/aio8pro/android/version.txt', // android 检测升级地址
   
    isDebug: false, // 是否为调试模式，输出sql语句

    newLoginWays: false, // 是否采用新登录方式

    // AIO8
    aErp8Url: '',
    aGrp8Url: '',
    aio8ClientUrl: ''
};