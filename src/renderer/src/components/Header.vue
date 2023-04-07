<template>
  <div class="page-header">
    <ul v-show="renderView('home')" class="menu">
      <li class="menu-button" @click="handleClick($event, 'toAST')">转换 AST</li>
      <li class="menu-button" @click="handleClick($event, 'saveToLocal')">暂存到本地</li>
      <li class="menu-button" @click="handleRouter($event, 'record')">本地恢复</li>
      <li class="menu-button" @click="handleClick($event, 'exportJSON')">导出到 JSON</li>
    </ul>
    <ul v-show="renderView('record')" class="menu record">
      <li class="menu-button" @click="handleRouter($event, '/')">返回</li>
      <li class="menu-button" @click="handleClear()">清空</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { emitter } from '@renderer/utils'
import { useRoute, useRouter } from 'vue-router'
import { LOCAL_DB_STORE_NAME, LOCAL_DB } from '@renderer/const'

const context = ref({ routeName: '' })

const route = useRoute()
const router = useRouter()

function handleClick(event, cmd) {
  emitter.emit('HeaderEvent', {
    type: 'click',
    target: cmd,
    currentTarget: 'Header'
  })
}

function handleRouter(event, name = '/') {
  return router.push(name)
}

async function handleClear() {
  await LOCAL_DB.clear(LOCAL_DB_STORE_NAME)
  handleRouter('/')
}

emitter.on('RecordEvent', (args) => {
  const { target } = args

  setTimeout(() => {
    emitter.emit('HeaderEvent', {
      type: 'record',
      target: target,
      currentTarget: 'record'
    })
  })
})

const renderView = (index = 'home') => context.value.routeName === index

watch(route, (newValue, oldValue) => {
  context.value.routeName = newValue.name
})
</script>

<style lang="less">
.page-header {
  padding-top: 30px;
  height: 30px;
  -webkit-app-region: drag;
}

.menu {
  display: flex;
  list-style: none;
  justify-content: center;
  font-size: 14px;

  .menu-button {
    padding: 5px 10px;
    margin: 0 5px;
    border-radius: 5px;
    color: var(--color-e8eaed);
    display: inline-flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms ease-in;

    &:hover {
      background: #3d4043;
      cursor: pointer;
    }

    &:active {
      color: var(--color-202124);
      background-color: var(--color-93b3f2);
    }
  }
}

.menu.record {
  justify-content: flex-start;
  padding-left: 10px;

  & > .menu-button {
    color: var(--color-93b3f2) !important;
  }

  & > .menu-button:active {
    color: var(--color-202124) !important;
  }
}
</style>
