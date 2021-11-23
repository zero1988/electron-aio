const path = require('path')
const sqlite3 = require('sqlite3').verbose()

window.sqlite = {
    db: null,
    open(args, success, error) {
        try {
            const name = args[0]['name']
            const filename = path.join(__dirname, '../db/' + name + '.db')
            this.db = new sqlite3.Database(filename)
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

            this.db.serialize(() => {
                queries.forEach(item => {
                    let result = {
                        type: 'success',
                        message: '',
                        result: null
                    }
                    let pattern = /^[\s;]*([^\s;]+)/
                    if (pattern.test(item.sql)) {
                        let queryType = item.sql.match(pattern)[0]
                        switch (queryType.toLowerCase()) {
                            case 'insert':
                            case 'update':
                            case 'delete':
                                this.db.run(item.sql, item.params, (err) => {
                                    if (err) {
                                        result.type = 'error'
                                        result.message = err ? err.message : ''
                                    }
                                    callback(result)
                                })
                                break
                            case 'select':
                                this.db.all(item.sql, item.params, (err, rows) => {
                                    if (err) {
                                        result.type = 'error'
                                        result.message = err ? err.message : ''
                                    } else {
                                        result.result = rows
                                    }
                                    callback(result)
                                })
                                break
                            default:
                                break
                        }
                    }
                })
            })
        }
    }
}

module.exports = window.sqlite