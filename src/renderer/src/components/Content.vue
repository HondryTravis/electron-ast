<template>
  <div class="content-view">
    <div class="content-view-html">
      <div class="content-view-title">代码编辑器</div>
      <div class="html-wrapper">
        <div ref="htmlRef" class="html-editor"></div>
      </div>
    </div>
    <div class="content-view-json">
      <div class="content-view-title">JSON 视图</div>
      <div ref="json" class="json-wrapper">
        <json-viewer :value="context.json" copyable sort :theme="'dark'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, getCurrentInstance, ref, onBeforeUnmount } from 'vue'
import { basicSetup, EditorView } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { oneDarkTheme } from '@codemirror/theme-one-dark'
import { html } from '@codemirror/lang-html'
import { LOCAL_DB_STORE_NAME } from '@renderer/const/db'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Transform } from '../../lib/transform'

import { emitter } from '../utils'

const instance = getCurrentInstance()
const editorView = ref<any>(null)

const transform = Transform.of()

const context = reactive({
  json: {
    attribs: {},
    children: [
      {
        data: 'hello world!',
        endIndex: null,
        next: null,
        parent: {},
        prev: null,
        startIndex: null,
        type: 'text'
      }
    ],
    endIndex: null,
    name: 'div',
    next: null,
    parent: {},
    prev: null,
    startIndex: null,
    type: 'tag'
  },
  html: `<div>hello world!</div>`
})

const createEditor = () => {
  if (editorView.value) {
    editorView.value.destory()
  }

  const updatesExtension = EditorView.updateListener.of((tr) => {
    if (tr.docChanged) {
      context.html = tr.state.doc.toString()
    }
  })

  const state = EditorState.create({
    doc: context.html,
    extensions: [basicSetup, oneDarkTheme, html(), updatesExtension]
  })

  if (instance?.refs.htmlRef) {
    editorView.value = new EditorView({
      state: state,
      parent: instance?.refs.htmlRef as HTMLElement
    })

    window.__EDITOR__ = editorView.value
  }
}

const transformEvents = {
  toAST: async () => {
    const html = context.html
    const json = (transform as any).HTMLParser.parseASTFromHTML(html)
    context.json = json
  },

  saveToLocal: async () => {
    const json = JSON.stringify(context.json)
    window.LOCAL_DB_WRITE(LOCAL_DB_STORE_NAME)({ json, html: context.html })
  },

  exportJSON: async () => {
    const json = JSON.stringify(context.json)

    const blob = new Blob([json], { type: 'application/json' })

    const objectURL = URL.createObjectURL(blob)
    const aTag = document.createElement('a')

    aTag.href = objectURL
    aTag.download = 'data.json'
    aTag.click()

    if (aTag) {
      aTag.remove()
    }
  },
  record: (target) => {
    setTimeout(() => {
      const { state } = editorView.value
      editorView.value.dispatch({
        changes: { from: 0, to: state.doc.length, insert: target.detail.html }
      })

      transformEvents.toAST()
    })
  }
}

emitter.on('HeaderEvent', (args) => {
  const { target, type } = args as any
  switch (type) {
    case 'click':
      transformEvents[target]()
      break
    case 'record':
      transformEvents[type](target)
      break
  }
})

onMounted(() => {
  setTimeout(() => {
    createEditor()
  })
})

onBeforeUnmount(() => {
  emitter.off('HeaderEvent')
})
</script>

<style lang="less">
@import 'vue3-json-viewer/dist/index.css';

.content-view {
  display: flex;
  height: calc(100vh - 60px);

  .content-view-title {
    height: 30px;
    line-height: 30px;
  }

  .content-view-title:first-child {
    padding-left: 5px;
  }

  .content-view-html {
    flex: 2;
    position: relative;
    height: 100%;
    overflow: auto;
  }

  .html-wrapper {
    position: relative;
    height: calc(100% - 30px);
    border-right: 1px solid #7d8799;

    & > div {
      height: 100%;
    }
  }

  .json-wrapper {
    overflow: auto;
    height: calc(100% - 30px);

    .jv-code {
      overflow: auto !important;
    }
  }

  .content-view-json {
    flex: 1;
    position: relative;
    height: 100%;
    overflow: auto;
  }

  .content-view-html {
    .cm-editor {
      height: 100%;
      overflow: scroll;
    }
  }
}
</style>
