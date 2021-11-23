const cefMain = require('./cefMain');

window.cef = {}

Object.assign(window.cef, cefMain);

module.exports = window.cef