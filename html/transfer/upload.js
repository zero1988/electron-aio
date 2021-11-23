var Upload = function (cfg) {
    this.container = cfg.container
    this.files = cfg.files
    this.items = []
    this.init()
    return this
}

Upload.prototype.init = function () {
    var me = this
    for (var i = 0; i < me.files.length; i++) {
        var file = me.files[i]
        var item = new UploadItem(file)
        me.items.push(item)
        me.container.append(item.el)
        item.bindEvents()
    }
    return me
}

Upload.prototype.createNewItem = function (file) {
    var me = this
    // 先判断是否已经存在了，存在就重新下载
    for (var i = 0; i < me.files.length; i++)
    {
        if (me.files[i].file_id == file.file_id)
        {
            return me.items[i];
        }
    }
    var item = new UploadItem(file)
    me.container.prepend(item.el)
    item.bindEvents()
    me.items.push(item)
    me.files.push(file)
    me.addTitle();

    return item
}

Upload.prototype.removeItem = function (file) {
    //this.removeTitle();
    for (var i = 0; i < this.files.length; i++) {
        if (this.files[i].msg_id == file.msg_id) {
            this.removeTitle();
            this.items[i].el.remove();
            this.files.splice(i, 1);
            this.items.splice(i, 1);
        }
    }
}

Upload.prototype.removeAllItem = function () {
    this.removeAllTitle();
    //for (var i = 0; i < this.files.length; i++) {
    //    this.items[i].el.remove();
    //}
    this.container.empty();
    this.files = [];
    this.items = [];
}

// tab标题头加一
Upload.prototype.addTitle = function () {
    var title = $('[data="upload"]');
    var num = getNumByStr(title.text());
    num = num + 1;
    title.text('上传列表(' + num + ')');
}

// tab标题头减一
Upload.prototype.removeTitle = function () {
    var title = $('[data="upload"]');
    var num = getNumByStr(title.text());
    num = num - 1;
    var t = '上传列表';
    if (num > 0) {
        t = '上传列表(' + num + ')';
    }
    title.text(t);
}

Upload.prototype.removeAllTitle = function () {
    var title = $('[data="upload"]');
    var t = '上传列表';
    title.text(t);
}

var UploadItem = function (file) {
    this.itemId = file.file_id
    var html = newUploadRecord(file)
    this.el = $(html)
    if (!file.status) {
        this.status = 'ready'
    } else {
        this.status = file.status;
    }
    this.refreshStatus();
    
    this.fileObj = file  // 暂时先用file代替，后面需要追加 支持断点续传的 相关信息
    return this
}

UploadItem.prototype.bindEvents = function () {
    var me = this

    me.el.bind('click', function () {
        me.el.addClass('selected');
        me.el.siblings('.selected').removeClass('selected');
    });

    me.el.find('.transfer-close').bind('click', function () {
        var file = me.fileObj;
        cefTransfer.hideUpload(file.file_id, function (stu) {
            switch (stu) {
                case 0:
                    mUpload.removeItem(file);
                    cefTransfer.exec("hideBFileInBFileForm", JSON.stringify(file));
                    break;
                case 1:// 取消失败
                default:
                    alert('取消失败');
                    break;
            }
        });
    })

    me.el.find('.btnCmd').bind('click', function () {
        switch (me.status) {
            case 'ready':
                me.upload()
                break
            case 'cancel':
                me.upload()
                break
            case 'uploading':
                me.cancel();
                break;
            case 'success':
                me.openFolder();
                break
        }
    })

    //me.el.find('.btnCancel').bind('click', function () {
    //    alert('取消')
    //})
    return me
}

UploadItem.prototype.upload = function (success, failure) {
    var me = this, file = me.fileObj;
    me.el.find('.progress-info').hide()
    me.el.find('.progress-desc').text('初始化文件信息...').show()

    me.el.find('.file-size').hide()
    me.el.find('.progress-container').show()
    me.el.find('.progress-wrapper').hide()

    me.status = 'init'
    me.refreshStatus()

    cefTransfer.doUpload(JSON.stringify(this.fileObj), function (data) {
        if (me.status == 'cancel') {
            me.refreshStatus();
            return; // 若是自己手动取消了，则不继续
        }
        var res = JSON.parse(data)
        //console.log(res);
        if (res.err_code != 0) { // 失败
            me.status = 'fail';
            me.refreshStatus();
                me.el.find('.progress-info').hide()
                me.el.find('.progress-desc').text(res.err_msg).show()
                // 处理主页逻辑
                cefTransfer.exec('upBigFileFailure', JSON.stringify(file));
                if (failure) failure(res);
        } else {
                if (res.status == 'progress') {
                    me.el.find('.progress-wrapper').show()
                    me.el.find('.progress-desc').hide()
                    me.el.find('.progress-info').show()
                    me.el.find('.speed').text(getSizeStr(res.speed) + "/S")
                    me.el.find('.receive').text(getSizeStr(res.current))
                    me.el.find('.total').text(getSizeStr(res.total))
                    me.el.find('.progress').css('width', res.percent + '%')
                } else if (res.status == 'ready') {
                    me.el.find('.progress-info').hide()
                    me.el.find('.progress-desc').text('初始化文件信息成功').show()
                    me.status = 'uploading'
                    me.refreshStatus()
                } else if (res.status == 'success') {
                    me.el.find('.progress-container').hide()
                    me.el.find('.file-size').show()
                    me.status = 'success'
                    me.refreshStatus()

                    if (!hideComplete) {
                        mUpload.removeItem(file);
                        mComplete.createNewItem(file);
                    }
                    
                    // 处理主页逻辑
                    cefTransfer.exec('upBigFileSuccess', JSON.stringify(file));
                    if (success) {
                        success(res);
                    }
                }

            }
        })
}

UploadItem.prototype.cancel = function () {
    var me = this, fid = me.fileObj.file_id;

    cefTransfer.cancelUpload(fid, function (stu) {
        switch (stu) {
            case 0:
                me.status = 'cancel'
                me.refreshStatus();
                me.el.find('.progress-info').hide()
                me.el.find('.progress-desc').text('您已取消上传').show()

                cefTransfer.exec("cancelBFile", fid);
                break;
            case 1:// 取消失败
                alert('取消失败');
                break;
            default:
                break;
        }
    });
}

UploadItem.prototype.openFolder = function () {
    var p = this.fileObj.path;
    cefTransfer.openFolder(p);
}

UploadItem.prototype.refreshStatus = function () {
    var me = this,
        btn = me.el.find('.btnCmd');
    if (me.status == 'init') {
        btn.hide();
    } else if (me.status == 'uploading') {
        btn.removeClass('btn-blue')
        btn.show();
    } else {
        btn.show();
        if (!btn.hasClass('btn-blue'))
            btn.addClass('btn-blue')
    }
    btn.text(getUploadBtnText(me.status))
}

var newUploadRecord = function (file) {

    var html = ''
    html += '<div class="file-content" file-id="' + file.file_id + '" msg-id="' + file.msg_id + '">'
    html += '<div class="icon-wrapper">'
    html += '<img class="icon" src="../css/images/' + getIcon(file.extension) + '"/>'
    html += '</div>'

    html += '<div class="file-details">'
    html += '<div class="title-area">'
    html += '<a class="action-link link-bolder">' + file.file_name + '</a>'
    html += '</div>'
    html += '<div class="file-size">' + getSizeStr(file.file_size) + '&nbsp;来自会话：' + file.chat_name +'</div>'

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

    html += '</div>'
    html += '<div class="control-wrapper control-content-center">'
    html += '<a class="btn btn-blue btnCmd" data-status="ready">上传</a>'
    html += '</div>'
    html += '<div class="icon-window-close transfer-close" title= "删除" ></div>' 
    html += '</div>'

    return html
}


var getIcon = function (ext) {
    if (!ext.startsWith('.')) ext = '.' + ext;
    switch (ext.toLocaleLowerCase()) {
        case '.txt':
        case '.rtf':
            return 'text.png'
        case '.wav':
        case '.aif':
        case '.au':
        case '.mp3':
        case '.ram':
        case '.wma':
        case '.mmf':
        case '.amr':
        case '.aac':
        case '.flac':
        case '.mod':
        case '.cd':
        case '.md':
        case '.asf':
        case '.mp3pro':
        case '.vqf':
        case '.ape':
        case '.mid':
        case '.ogg':
        case '.m4a':
        case '.aac+':
        case '.aiff':
            return 'audio.png'
        case '.doc':
        case '.docx':
            return 'word.png'
        case '.xls':
        case '.xlsx':
            return 'excel.png'
        case '.ppt':
        case '.pptx':
            return 'ppt.png'
        case '.html':
        case '.htm':
        case '.c':
        case '.cs':
        case '.cpp':
        case '.asm':
        case '.for':
        case '.lib':
        case '.lst':
        case '.msg':
        case '.obj':
        case '.pas':
        case '.wki':
        case '.bas':
        case '.xml':
        case '.m':
        case '.go':
        case '.java':
            return 'code.png'
        case '.exe':
        case '.apk':
        case '.ipa':
        case '.com':
        case '.jar':
            return 'exe.png'
        case '.pdf':
            return 'pdf.png'
        case '.bmp':
        case '.gif':
        case '.jpg':
        case '.jpeg':
        case '.pic':
        case '.png':
        case '.tif':
        case '.psd':
        case '.tiff':
        case '.pcx':
        case '.tga':
        case '.exif':
        case '.fpx':
        case '.svg':
        case '.pcd':
        case '.dxf':
        case '.ufo':
        case '.eps':
        case '.ai':
        case '.raw':
            return 'pic.png'
        case '.mpeg':
        case '.mpg':
        case '.avi':
        case '.mov':
        case '.wmv':
        case '.navi':
        case '.3gp':
        case '.ra':
        case '.mkv':
        case '.flv':
        case '.f4v':
        case '.rmvb':
        case '.webm':
        case '.swf':
            return 'video.png'
        case '.rar':
        case '.zip':
        case '.arj':
        case '.gz':
        case '.z':
        case '.iso':
            return 'zip.png'
        default:
            return 'default.png'
    }

}

var getSizeStr = function (bytes) {
    if (!bytes) return '0B';
    if (bytes === 0 || bytes == 'null') return '0 B'
    var k = 1024, // or 1024
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
}

var getUploadBtnText = function (status) {
    switch (status) {
        case 'init':
            return '初始化'
        case 'ready':
            return '上传'
        case 'cancel': // 手动取消上传
            return '重新上传'
        case 'uploading':
            return '取消'
        case 'success':
            return '查看'
        default:
            return '失败'
    }
}