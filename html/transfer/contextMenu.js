// 错误提示没做

var execContext = function (op) {
    var menu = document.getElementById("menu");
    menu.style.display = "none";
    var url = decodeURI(currentUrl);
    var fileName = getFileName(url);
    switch (op) {
        case 'copy':
            cefTransfer.setCopyData(url);
            break;
        case 'saveAs':
            cefTransfer.saveAs(url, fileName);
            break;
        case 'open':
            cefTransfer.openFile(url, (data) => { });
            break;
        case 'openFolder':
            cefTransfer.openFolder(url);
            break;
        case 'openOrigin':

    }
}

var newMenu = function (file) {
    var html = ''
    html += '<ul id="menu" class="popup-item">'
    html += '<li id="file-copy" onclick="execContext(""copy"")>复制</li>'
    html += '<li id="file-open" onclick="execContext(""open"")>打开</li>'
    html += '<li id="file-saveAs" onclick="execContext(""saveAs"")>另存为</li>'
    html += '<li id="file-openFolder" onclick="execContext(""openFolder"")>打开目录</li>'
    html += '</ul>'
    return html
}

var showMenuVisible = function (menu, e) {
    if (!e) return;
    menu.style.display = "none";
    if (e.clientX + 120 + 20 >= window.document.body.clientWidth) {
        menu.style.left = (e.clientX - 100) + 'px';
    } else {
        menu.style.left = e.clientX + 'px';
    }

    if (e.clientY + 120 + 20 >= window.document.body.clientHeight) {
        menu.style.top = (e.clientY - 120) + 'px';
    } else {
        menu.style.top = e.clientY + 'px';
    }
    menu.style.display = "block";
}

var getFileName = function(path) {
    if (!path) return '';

    return this.splitPath(path)[1];
}

var splitPath = function (path) {
    var dirName = '',
        fileName = '',
        idx = path.lastIndexOf('/');
    if (idx == -1) {
        fileName = path;
    } else {
        dirName = path.substr(0, idx);
        fileName = path.substr(idx + 1);
    }
    idx = fileName.indexOf('?'); // modified.jpg?1408426399534
    if (idx >= 0) {
        fileName = fileName.substr(0, idx);
    }

    return [dirName, this.stripIllegalChars(fileName)];
}

var stripIllegalChars = function(s) {
    if (s == null) return s;

    return s.replace(/[\\\\/:*?"<>|]/g, '_');
}

// 下载文件至指定位置
var downloadToPath = function () {
    $('#downloadToPath').hide();
    var fileid = $('#downloadToPath').attr('fileid'),
        fileItem = mDownload.getItem(fileid);

    if (!fileItem) alert('不存在fileid为' + fileid + '的param');

    cefTransfer.downloadToPath(function (path) {
        //var p = path.replace(/\\/g, '/');
        //if (!p.startsWith('file:///')) {
        //    p = 'file:///' + p + '/' + fileItem.fileObj.file_name;
        //}
        var p = getFileUri(path) + '/' + fileItem.fileObj.file_name;
        fileItem.fileObj.down_to_path = p;
        fileItem.download();
    }, function (err) {
        alert(err);
    });
}