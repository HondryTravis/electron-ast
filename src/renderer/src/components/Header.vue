<template>
  <div class="page-header">
    <ul class="menu">
      <li class="menu-button" @click="handleClick($event, 'toAST')">转换 AST</li>
      <li class="menu-button" @click="handleClick($event, 'saveToLocal')">暂存到本地</li>
      <li class="menu-button" @click="handleClick($event, 'localRestore')">本地恢复</li>
      <li class="menu-button" @click="handleClick($event, 'exportJSON')">导出到 JSON</li>
    </ul>
  </div>
</template>

<script setup>
import { emitter } from '../utils'

function handleClick(event, cmd) {
  emitter.emit('HeaderEvent', {
    type: 'click',
    target: cmd,
    currentTarget: 'Header'
  })
}
</script>

<style lang="less">
.page-header {
  padding-top: 20px;
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
</style>
