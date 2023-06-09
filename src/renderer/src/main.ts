declare global {
  interface Window {
    LOCAL_DB: any
    LOCAL_DB_WRITE: (storeName: any) => (details: any) => void
    __EDITOR__: any
    __CACHE__: Record<string, any>
  }
}

import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import JsonViewer from 'vue3-json-viewer'

window.__CACHE__ = {}

const app = createApp(App)

app.use(JsonViewer)
app.use(router)
app.mount('#app')
