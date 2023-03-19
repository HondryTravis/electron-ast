export interface IndexDetails {
  indexName: string
  order: string
}

export class Utils {
  indexedDB: IDBFactory

  constructor() {
    this.indexedDB = window.indexedDB
                  || (<any>window).mozIndexedDB
                  || (<any>window).webkitIndexedDB
                  || (<any>window).msIndexedDB
  }

  deleteDatabase(name: string) {
    const request = this.indexedDB.deleteDatabase(name)
    const promise = new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const msg = {
          msg: 'Database deleted successfully',
          status: true
        }
        resolve(msg)
      }
      request.onerror = () => {
        const msg = {
          msg: 'Database deleted failed',
          status: false,
          activeRequest: request
        }
        reject(msg)
      }
    })
    return promise
  }
}

type OperationOptions = {
  storeName: string
  dbMode: IDBTransactionMode
  error: (e: Event) => any
  complete: (e: Event) => any
  abort?: (e: Event) => any
}

export class DbWrapper {
  dbName: string
  dbVersion: number
  db: IDBDatabase | null

  constructor(dbName: string, version: number) {
    this.dbName = dbName
    this.dbVersion = version || 1
    this.db = null
  }

  validateStoreName(storeName: string) {
    return this.db!.objectStoreNames.contains(storeName)
  }

  validateBeforeTransaction(storeName: string, reject: Function) {
    if (!this.db) {
      reject(`请先使用 openDatabase 方法打开数据库，在创建数据表(${storeName}), 然后再进行操作!!!`)
    }
    if (!this.validateStoreName(storeName)) {
      reject(`数据表 ${ storeName } 不存在, 请删除过期数据库 ${this.dbName} 后刷新 `)
    }
  }

  createTransaction(options: OperationOptions): IDBTransaction {
    let trans: IDBTransaction = this.db!.transaction(options.storeName, options.dbMode)
    trans.onerror = options.error
    trans.oncomplete = options.complete

    if (options.abort) trans.onabort = options.abort
    return trans
  }
}

export class LocalDB {

  static of(dbName: string, version: number) {
    return new LocalDB(dbName, version)
  }

  utils: Utils
  dbWrapper: DbWrapper

  constructor(dbName: string, version: number) {
    this.utils = new Utils()
    this.dbWrapper = new DbWrapper(dbName, version)
  }

  openDatabase(version: number, upgradeCallback?: Function) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      this.dbWrapper.dbVersion = version
      const request = this.utils.indexedDB.open(this.dbWrapper.dbName, version)

      request.onsuccess = function (e) {
        that.dbWrapper.db = request.result
        resolve(void 0)
      }

      request.onerror = function (e) {
        reject(
          'IndexedDB 打开错误: ' + (<any>e.target).errorCode
            ? (<any>e.target).errorCode + ' (' + (<any>e.target).error + ')'
            : (<any>e.target).errorCode
        )
      }

      if (typeof upgradeCallback === 'function') request.onupgradeneeded = (e) => upgradeCallback(e, that.dbWrapper.db)
    })
  }

  getByKey(storeName: string, key: any) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readonly',
        error: (e: Event) => reject(e),
        complete: (e: Event) => {},
      }
      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)

      let request: IDBRequest

      request = objectStore.get(key)
      request.onsuccess = function (event: Event) {
        resolve((<any>event.target).result)
      }
    })
  }

  getAll(storeName: string, keyRange?: IDBKeyRange, indexDetails?: IndexDetails) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readonly',
        error: (e: Event) => reject(e),
        complete: (e: Event) => {},
      }

      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)
      const result: Array<any> = []

      let request: IDBRequest

      if (indexDetails) {
        const index = objectStore.index(indexDetails.indexName), order = indexDetails.order === 'desc' ? 'prev' : 'next'
        request = index.openCursor(keyRange, <IDBCursorDirection>order)
      } else {
        request = objectStore.openCursor(keyRange)
      }

      request.onerror = (e) => reject(e)

      request.onsuccess = function (evt: Event) {
        const cursor: Record<string, any> = (<IDBOpenDBRequest>evt.target).result
        if (cursor) (result.push(cursor['value']), cursor['continue']())
        else resolve(result)
      }
    })
  }

  add(storeName: string, value: any, key?: any) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readwrite',
        error: (e: Event) => reject(e),
        complete: (e: Event) => resolve({ key: key, value: value }),
      }

      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)

      const request = objectStore.add(value, key)
      request.onsuccess = (evt: any) => (key = evt.target.result)
    })
  }

  update(storeName: string, value: any, key?: any) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readwrite',
        error: (e: Event) => reject(e),
        complete: (e: Event) => resolve(value),
        abort: (e: Event) => reject(e),
      }

      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)

      objectStore['put'](value, key)
    })
  }

  delete(storeName: string, key: any) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readwrite',
        error: (e: Event) => reject(e),
        complete: (e: Event) => resolve(void 0),
        abort: (e: Event) => reject(e),
      }

      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)

      objectStore['delete'](key)
    })
  }

  openCursor(storeName: string, cursorCallback: (evt: Event) => void, keyRange?: IDBKeyRange) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readonly',
        error: (e: Event) => reject(e),
        complete: (e: Event) => resolve(void 0),
        abort: (e: Event) => reject(e)
      }

      const transaction = that.dbWrapper.createTransaction(options)

      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.openCursor(keyRange)

      request.onsuccess = (evt: Event) => (cursorCallback(evt), resolve(void 0))
    })
  }

  clear(storeName: string) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readwrite',
        error: (e: Event) => reject(e),
        complete: (e: Event) => resolve(void 0),
        abort: (e: Event) => reject(e),
      }

      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)

      objectStore['clear']()
      resolve(void 0)
    })
  }

  getByIndex(storeName: string, indexName: string, key: any) {
    const that = this
    return new Promise<any>((resolve, reject) => {
      that.dbWrapper.validateBeforeTransaction(storeName, reject)

      const options: OperationOptions = {
        storeName: storeName,
        dbMode: 'readonly',
        error: (e: Event) => reject(e),
        abort: (e: Event) => reject(e),
        complete: (e: Event) => {},
      }

      const transaction = that.dbWrapper.createTransaction(options)
      const objectStore = transaction.objectStore(storeName)
      const index = objectStore.index(indexName)
      const request = index.get(key)

      request.onsuccess = (event) => resolve((<IDBOpenDBRequest>event.target).result)
    })
  }

  destroy() {
    return this.utils.deleteDatabase(this.dbWrapper.dbName)
  }
}

