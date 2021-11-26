const path = require('path')
const sqlite3 = require('better-sqlite3')


window.SqliteCommand = function (db, type, sql, params) {
    this.db = db
    this.sql = sql
    this.params = params
    this.type = type
    this.ExecuteNonQuery = function () {
        const me = this,
            result = {
                type: 'success',
                result: {}
            }
        try {
            const info = me.db.prepare(me.sql).run(me.params)
            if (me.type === 'insert') {
                if (info.lastInsertRowid) {
                    result.result = {
                        insertId: info.lastInsertRowid,
                        rowsAffected: 1
                    }
                } else {
                    result.result = {
                        rowsAffected: 0
                    }
                }
            } else {
                if (this.changes > 0) {
                    result.result = {
                        rowsAffected: info.changes
                    }
                }
            }
        } catch (err) {
            result.type = 'error'
            result.result = {
                code: err.code,
                message: err.message
            }
        }
        return result
    }
    this.ExecuteQuery = function () {
        const me = this,
            result = {
                type: 'success',
                result: {}
            }

        try {
            const rows = me.db.prepare(me.sql).all(me.params)
            result.result = {
                rows: rows
            }
        } catch (err) {
            result.type = 'error'
            result.result = {
                code: err.code,
                message: err.message
            }
        }
        return result
    }
}

window.sqlite = {
    db: null,
    open(args, success, error) {
        try {
            const name = args[0]['name']
            const filename = path.join(__dirname, '../db/' + name + '.db')
            this.db = new sqlite3(filename)
            success();
        } catch (e) {
            this.db = null
            error(e)
        }
    },
    closeEx(name, success, error) {
        this.close(name, success, error)
    },
    close(name, success, error) {
        if (this.db) {
            this.db.close()
            this.db = null
        }
        success()
    },
    backgroundExecuteSqlBatch(args, callback) {
        const allargs = args[0]
        const txargs = allargs['executes']
        if (txargs.length == 0) {
            callback('找不到执行列表')
        } else {
            const queries = []
            txargs.forEach(item => {
                let sql = item['sql']
                let params = item['params']
                queries.push({
                    sql,
                    params
                })
            })


            let results = []
            queries.forEach(item => {
                item.sql = item.sql.replace(/"/g, '\'')
                let pattern = /^[\s;]*([^\s;]+)/
                if (pattern.test(item.sql)) {
                    let type = item.sql.match(pattern)[0]
                    let command = new SqliteCommand(this.db, type, item.sql, item.params)
                    switch (type.toLowerCase()) {
                        case 'select':
                            results.push(command.ExecuteQuery());
                            break
                        case 'insert':
                        case 'update':
                        case 'delete':
                        default:
                            results.push(command.ExecuteNonQuery());
                            break
                    }
                }
            })
            callback(JSON.stringify(results))

        }
    }
}

module.exports = window.sqlite