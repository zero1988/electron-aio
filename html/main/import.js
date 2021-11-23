var head = document.getElementsByTagName('head').item(0);
var spt = document.createElement('script');
spt.type = 'text/javascript';
spt.src = JS_PRE + '/html/plugins/FilePlugin.js?' + new Date().getTime();
head.appendChild(spt);


var head = document.getElementsByTagName('head').item(0);
var spt = document.createElement('script');
spt.type = 'text/javascript';
spt.src = JS_PRE + '/html/plugins/FileTransferPlugin.js?' + new Date().getTime();
head.appendChild(spt);