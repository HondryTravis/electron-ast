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
.menu {
  display: flex;
  list-style: none;
  font-size: 12px;
  height: 50px;

  .menu-button {
    padding: 10px;
    border-radius: 5px;
    background: #87cefa;
    color: #ffffff;
    margin: 10px;
    display: inline-flex;
    justify-content: center;
    align-items: center;

    &:hover {
      opacity: 0.8;
      cursor: pointer;
    }
  }
}
</style>
