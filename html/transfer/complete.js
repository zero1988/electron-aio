var Complete = function (cfg) {
    this.container = cfg.container
    this.files = cfg.files
    this.items = []
    this.init()
    return this
}

Complete.prototype.init = function () {
    var me = this
    for (var i = 0; i < me.files.length; i++) {
        var file = me.files[i]
        var item = new CompleteItem(file)
        me.items.push(item)
        me.container.append(item.el)
        item.bindEvents()
    }
    return me
}

Complete.prototype.createNewItem = function (file) {
    var me = this
    var item = new CompleteItem(file)
    me.container.prepend(item.el)
    item.bindEvents()
    me.items.push(item)
    me.files.push(file)
    me.addTitle();

    return item
}

Complete.prototype.removeItem = function (file) {
    for (var i = 0; i < this.files.length; i++) {
        if (this.files[i].msg_id == file.msg_id) {
            this.removeTitle();
            this.items[i].el.remove();
            this.files.splice(i, 1);
            this.items.splice(i, 1);
        }
    }
}

Complete.prototype.removeAllItem = function () {
    this.removeAllTitle();
    //for (var i = 0; i < this.files.length; i++) {
    //    this.items[i].el.remove();
    //}
    this.container.empty();
    this.files = [];
    this.items = [];
}

// tab标题头加一
Complete.prototype.addTitle = function () {
    var title = $('[data="complete"]');
    var num = getNumByStr(title.text());
    num = num + 1;
    title.text('已完成(' + num + ')');
}

// tab标题头减一
Complete.prototype.removeTitle = function () {
    var title = $('[data="complete"]');
    var num = getNumByStr(title.text());
    num = num - 1;
    var t = '已完成';
    if (num > 0) {
        t = '已完成(' + num + ')';
    }
    title.text(t);
}
Complete.prototype.removeAllTitle = function () {
    var title = $('[data="complete"]');
    var t = '已完成';
    title.text(t);
}

Complete.prototype.scrollToFile = function (fileid) {
    var file;
    for (var i = 0; i < this.items.length; i++) {
        file = this.items[i].fileObj;
        if (file.file_id == fileid) {
            // 滚动到相应位置
            return;
        }
    }
}

var CompleteItem = function (file) {
    this.itemId = file.file_id
    var html = newCompleteRecord(file)
    this.el = $(html)
    this.status = 'ready'
    this.fileObj = file  // 暂时先用file代替，后面需要追加 支持断点续传的 相关信息
    return this
}

CompleteItem.prototype.bindEvents = function () {
    var me = this

    me.el.bind('click', function () {
        me.el.addClass('selected');
        me.el.siblings('.selected').removeClass('selected');
    });

    me.el.find('.transfer-close').bind('click', function () {
        var file = me.fileObj;
        mComplete.removeItem(file);
        cefTransfer.exec("hideBFileInBFileForm", JSON.stringify(file));
    })

    me.el.find('.btnCmd').bind('click', function () {
        switch (me.status) {
            case 'ready':
                me.open()
                break
        }
    })

    me.el.bind('contextmenu', function (e) {
        var menu = $('#menu');
        if (menu.length == 0) {
            var html = newMenu(me.fileObj);
            menu = $(html);
            $('body').append(menu);
        }

        currentUrl = me.fileObj.path;

        showMenuVisible(menu[0], e);

        return false;
    });

    return me
}

CompleteItem.prototype.open = function (success) {
    var me = this;
    var p = this.fileObj.path;
    cefTransfer.openFolder(p);
    //cefTransfer.openFile(p, function (data) {
    //    if (data != '0') {
    //        // 打开失败
    //        me.status = 'fail'
    //    }
    //});
}

var newCompleteRecord = function (file) {

    var html = ''
    html += '<div class="file-content" file-id="' + file.file_id + '" msg-id="' + file.msg_id + '">'
    html += '<div class="icon-wrapper">'
    html += '<img class="icon" src="../css/images/' + getIcon(file.extension) + '"/>'
    html += '</div>'

    html += '<div class="file-details">'
    html += '<div class="title-area">'
    html += '<a class="action-link link-bolder">' + file.file_name + '</a>'
    html += '</div>'
    html += '<div class="file-size">' + getSizeStr(file.file_size) + '</div>'
    html += '<div class="file-from">来自会话: ' + file.chat_name + '</div>'
    html += '</div>'

    html += '<div class="file-date-wrapper">'
    html += '<span class="file-date">' + new Date(file.create_at).Format("yyyy-MM-dd hh:mm") + '</span>'
    html += '</div>'
    html += '<div class="control-wrapper">'
    html += '<a class="control-open action-link btnCmd">查看</a>'
    html += '</div>'
    html += '<div class="icon-window-close transfer-close" title= "删除"></div>' 

    html += '</div>'

    return html
}
