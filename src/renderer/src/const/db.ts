import { LocalDB } from '../../lib/db'

export const LOCAL_DB_NAME = 'AST_DB'
export const LOCAL_DB_STORE_NAME = 'RECORD'

export const LOCAL_DB = LocalDB.of(LOCAL_DB_NAME, 1)

window.LOCAL_DB = LOCAL_DB
window.LOCAL_DB_WRITE = function (storeName = LOCAL_DB_STORE_NAME, version = 1) {
  const time = new Date().toLocaleTimeString()
  const timestamp = Date.now()

  return (detail: any) => {
    const timer = setTimeout(async () => {
      await LOCAL_DB.openDatabase(version)
      const record = {
        type: 'record',
        detail: { ...detail },
        time,
        timestamp
      }
      await LOCAL_DB.add(storeName, record)
      clearTimeout(timer)
    })
  }
}

LOCAL_DB.openDatabase(1, (evt: any) => {
  if (evt.currentTarget) {
    const { result } = evt.currentTarget
    if (!Reflect.has(result.objectStoreNames, LOCAL_DB_STORE_NAME)) {
      const recordsStore = result.createObjectStore(LOCAL_DB_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true
      })

      recordsStore.createIndex('timestamp', 'timestamp')
      recordsStore.createIndex('type', 'type')
      recordsStore.createIndex('time', 'time')
    }
  }
})
