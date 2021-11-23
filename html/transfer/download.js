var Download = function (cfg) {
    this.container = cfg.container
    this.files = cfg.files
    this.items = []
    this.init()
    return this
}

Download.prototype.init = function () {
    var me = this
    for (var i = 0; i < me.files.length; i++) {
        var file = me.files[i]
        var item = new DownloadItem(file)
        me.items.push(item)
        me.container.append(item.el)
        item.bindEvents()
    }
    return me
}

Download.prototype.createNewItem = function (file) {
    var me = this
    for (var i = 0; i < me.files.length; i++) {
        if (me.files[i].msg_id == file.msg_id) {
            return me.items[i];
        }
    }
    var item = new DownloadItem(file)
    me.container.prepend(item.el)
    item.bindEvents()
    me.items.push(item)
    me.files.push(file)
    me.addTitle()

    return item;
}

Download.prototype.getItem = function (fileid) {
    for (var i = 0; i < this.files.length; i++) {
        if (this.files[i].file_id == fileid) {
            return this.items[i];
        }
    }
}

Download.prototype.removeItem = function (file) {
    for (var i = 0; i < this.files.length; i++) {
        if (this.files[i].msg_id == file.msg_id) {
            this.removeTitle();
            this.items[i].el.remove();
            this.files.splice(i, 1);
            this.items.splice(i, 1);
            return;
        }
    }
}

Download.prototype.removeAllItem = function () {
    this.removeAllTitle();
    //for (var i = 0; i < this.files.length; i++) {
    //    this.items[i].el.remove();
    //}
    this.container.empty();
    this.files = [];
    this.items = [];
}
// 更改为可下载态
Download.prototype.notifyCanDownload = function (fileid) {
    for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].fileObj.file_id == fileid) {
            this.items[i].status = 'notify';
            this.items[i].refreshStatus();
            this.items[i].fileObj.fileStatus = 9;
            this.files[i].fileStatus = 9;
            return;
        }
    }
}

// tab标题头加一
Download.prototype.addTitle = function () {
    var title = $('[data="down"]');
    var num = getNumByStr(title.text());
    num = num + 1;
    title.text('下载列表(' + num + ')');
}

// tab标题头减一
Download.prototype.removeTitle = function () {
    var title = $('[data="down"]');
    var num = getNumByStr(title.text());
    num = num - 1;
    var t = '下载列表';
    if (num > 0) {
        t = '下载列表(' + num + ')';
    }
    title.text(t);
}

Download.prototype.removeAllTitle = function () {
    var title = $('[data="down"]');
    var t = '下载列表';
    title.text(t);
}

var DownloadItem = function (file) {
    this.itemId = file.file_id
    var html = newDownloadRecord(file)
    this.el = $(html)

    if (file.status) {
        this.status = file.status;
    } else {
        this.status = 'beforeReady'
    }
    this.refreshStatus();
    this.fileObj = file // 暂时先用file代替，后面需要追加 支持断点续传的 相关信息
    return this
}

DownloadItem.prototype.bindEvents = function () {
    var me = this
    me.el.bind('click', function () {
        me.el.addClass('selected');
        me.el.siblings('.selected').removeClass('selected');
    });

    me.el.find('.btnCmd').bind('click', function () {
        switch (me.status) {
            case 'notify':
                me.download();
                break
            case 'downloading':
                me.pause()
                break
            case 'pause':
                me.download()
                break;
            case 'success':
                me.openFolder();
                break;
            case 'fail':
                me.download();
                break
        }
    })
    // 关闭按钮，暂未提供
    me.el.find('.transfer-close').bind('click', function () {
        var file = me.fileObj;
        cefTransfer.pauseDownload(file.file_id, file.file_name, function (size) {
            mDownload.removeItem(file)
            cefTransfer.exec('hideBFileInBFileForm', JSON.stringify(file));
        }, function (err) {
            console.error(err);
            alert(err);
        });
    })
    me.el.find('.btnCmd-arrow').bind('click', function (e) {
        menu = $('#downloadToPath');
        menu.attr('fileid', me.fileObj.file_id);
        showMenuVisible(menu.get(0), e);
        // 展示菜单，菜单上的按钮添加点击事件
        //cefTransfer.downloadToPath(function () {
            
        //}, function (err) {

        //});
    })

    return me
}

DownloadItem.prototype.openFolder = function () {
    var p = this.fileObj.path;
    cefTransfer.openFolder(p);
}

DownloadItem.prototype.download = function (success, failure) {
    var me = this, file = me.fileObj;
    //me.el.find('.progress-info').hide()
    //me.el.find('.progress-desc').text('初始化文件信息...').show()

    //me.el.find('.file-size').hide()
    //me.el.find('.progress-container').show()
    //me.el.find('.progress-wrapper').hide()

    me.status = 'init'
    me.refreshStatus();
    if (!file.down_to_path) {
        me.fileObj.down_to_path = file.down_to_path = getFileUri(cefTransfer.getBDataDirectory()) + '/' + file.file_name;
    }
    cefTransfer.exec('downloadingBigFile', JSON.stringify(file));
    cefTransfer.doDownload(JSON.stringify(file), function (data) {
        var res = JSON.parse(data)
            if (res.err_code != 0) {
                //me.el.find('.progress-info').hide()
                //me.el.find('.progress-desc').text(res.err_msg).show()
                me.status = 'fail';
                me.refreshStatus(res);
                cefTransfer.exec('downBigFileFailure', JSON.stringify(file));
                if (failure) failure(res);
            } else {
                if (res.status == 'ready') {
                    //me.el.find('.progress-info').hide()
                    //me.el.find('.progress-desc').text('初始化文件信息成功').show()
                    me.status = 'ready';
                    me.refreshStatus();
                } else if (res.status == 'progress') {
                    //me.el.find('.progress-wrapper').show()
                    //me.el.find('.progress-desc').hide()
                    //me.el.find('.progress-info').show()
                    //me.el.find('.speed').text(getSizeStr(res.speed) + "/S")
                    //me.el.find('.receive').text(getSizeStr(res.current))
                    //me.el.find('.total').text(getSizeStr(res.total))
                    //me.el.find('.progress').css('width', res.percent + '%')
                    me.status = 'downloading';
                    me.refreshStatus(res);
                    // 达到100%的时候，会计算hash，这个时候显示未变化
                } else if (res.status == 'success') {
                    //me.el.find('.progress-container').hide()
                    //me.el.find('.file-size').show()
                    me.status = 'success'
                    me.refreshStatus()

                    var p = getFileUri(res.path);
                    file.file_path = p;
                    file.path = p;
                    if (!hideComplete) {
                        mDownload.removeItem(file);
                        mComplete.createNewItem(file);
                    }

                    cefTransfer.exec('downBigFileSuccess', JSON.stringify(file));
                    if (success) {
                        success(res);
                    }
                }
            }
        })

}

DownloadItem.prototype.pause = function () {
    var me = this,
        file = me.fileObj;

    cefTransfer.pauseDownload(file.file_id, file.file_name, function (size) {
        me.status = 'pause';
        me.refreshStatus();
    }, function (err) {
        console.error(err);
        alert(err);
    });
}

DownloadItem.prototype.refreshStatus = function (res) {
    var me = this,
        btn = me.el.find('.btnCmd'), // 按钮
        infoCon = me.el.find('.info-show'), // 信息展示区
        progressCon = me.el.find('.progress-container'); // 进度条
    if (me.status == 'beforeReady') {
        me.hideBtn();
        me.showInfomation('等待对方上传成功');
    } else if (me.status == 'notify') {
        me.showBtn();
        me.el.find('.btnCmd').width(53);
        me.el.find('.btnCmd-arrow').show();
        me.showInfomation('等待确认下载');
    } else if (me.status == 'init') {
        me.hideBtn();
        me.showInfomation('数据初始化中');
    } else if (me.status == 'ready') {
        me.hideBtn();
        me.showInfomation('数据初始化成功');
    } else if (me.status == 'downloading') {
        btn.removeClass('btn-blue');
        btn.show();
        me.el.find('.speed').text(getSizeStr(res.speed) + "/S")
        me.el.find('.receive').text(getSizeStr(res.current))
        me.el.find('.total').text(getSizeStr(res.total))
        me.el.find('.progress').css('width', res.percent + '%')
        progressCon.show();
        infoCon.hide();
    } else if (me.status == 'pause') {
        me.showBtn();
        //me.showInfomation('');
    } else if (me.status == 'success') {
        me.showBtn();
        me.showInfomation('');
    } else if (me.status == 'fail') {
        me.showBtn();
        if (!res) {
            res = { err_msg: '' };
        }
        me.showInfomation(res.err_msg);
    } else {
        me.showBtn();
    }
    btn.text(getDownloadBtnText(me.status))
}
DownloadItem.prototype.showInfomation = function (msg) {
    const me = this,
        tipCon = me.el.find('.information-tip'), // 提示信息
        infoCon = me.el.find('.info-show'), // 信息展示区
        progressCon = me.el.find('.progress-container'); // 进度条
    progressCon.hide();
    tipCon.text(msg);
    infoCon.show();
}
DownloadItem.prototype.showBtn = function () {
    var btn = this.el.find('.btnCmd');
    btn.show();
    if (!btn.hasClass('btn-blue'))
        btn.addClass('btn-blue')
    this.el.find('.btnCmd-arrow').hide();
    btn.width(64);
}
DownloadItem.prototype.hideBtn = function () {
    var btn = this.el.find('.btnCmd');
    btn.hide();
    this.el.find('.btnCmd-arrow').hide();
}

var newDownloadRecord = function (file) {
    var html = '' 
    html += '<div class="file-content" file-id="' + file.file_id + '" msg-id="' + file.msg_id + '">'
    
    html += '<div class="icon-wrapper">'// 左
    html += '<img class="icon" src="../css/images/' + getIcon(file.extension) + '"/>'
    html += '</div>'
    
    html += '<div class="file-details">'// 中
    // 文件头
    html += '<div class="title-area">'
    html += '<a class="action-link link-bolder">' + file.file_name + '</a>'
    html += '</div>'

    html += '<div class="info-show">'
    html += '<div class="file-size">' + getSizeStr(file.file_size) + '&nbsp;来自会话：'+file.chat_name+'</div>'// 文件大小
    html += '<div class="information-tip"></div>' // 信息提示区域
    html += '</div>'

    // 下载进度
    html += '<div class="progress-container" style="display:none">'
    html += '<div class="progress-desc"></div>'
    html += '<div class="progress-info">'
    html += '<span class="speed">0KB/S</span> -'
    html += '<span class="receive">0KB</span> , 共'
    html += '<span class="total">' + getSizeStr(file.file_size) + '</span>'
    html += '</div>'
    html += '<div class="progress-wrapper">'
    html += '<span class="progress"></span>'
    html += '</div>'
    html += '</div>'

    html += '</div>' // file-details

    html += '<div class="control-wrapper control-content-center">'// 右
    html += '<a class="btn btn-blue btnCmd" data-status="ready">下载</a>'
    html += '<div class="btnCmd-arrow"><a class="btnCmd-arrow-inner"></a></div>'
    html += '</div>'
    html += '<div class="icon-window-close transfer-close" title="删除"></div>'// 删除按钮

    html += '</div>' // file-content最外层容器

    return html
}

var getDownloadBtnText = function (status) {
    switch (status) {
        case 'beforeReady':
            return '等待对方上传成功';
        case 'notify':
            return '下载';
        case 'init':
            return '初始化'
        case 'ready':
            return '初始化成功'
        case 'downloading':
            return '暂停'
        case 'pause':
            return '继续'
        case 'success':
            return '查看'
        case 'fail':
            return '重新下载'
        default:
            return '失败'
    }
}