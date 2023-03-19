<template>
  <div class="content-view">
    <div class="content-view-html">
      <div class="content-view-title">代码编辑器</div>
      <div class="html-wrapper">
        <div ref="html"></div>
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
const editorView = ref()

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

  const state = EditorState.create({
    doc: context.html,
    extensions: [basicSetup, oneDarkTheme, html()]
  })

  if (instance?.refs.html) {
    editorView.value = new EditorView({
      state: state,
      parent: instance?.refs.html as HTMLElement
    })

    window.__EDITOR__ = editorView.value
  }
}

const getHTML = () => {
  return editorView.value.state.doc.toString()
}

const transformEvents = {
  toAST: async () => {
    const html = getHTML()
    const json = (transform as any).HTMLParser.parseASTFromHTML(html)
    context.json = json
  },
  saveToLocal: async () => {
    window.LOCAL_DB_WRITE(LOCAL_DB_STORE_NAME)({ json: context.json, html: context.html })
  }
}

emitter.on('HeaderEvent', (args) => {
  const { target } = args as any
  transformEvents[target]()
})

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  emitter.off('HeaderEvent')
})
</script>

<style lang="less">
@import 'vue3-json-viewer/dist/index.css';

.content-view {
  display: flex;
  height: calc(100vh - 50px);

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
