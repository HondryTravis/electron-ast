<script setup lang="ts">
import Header from './components/Header.vue'
import Content from './components/Content.vue'
import './const/db'
</script>

<template>
  <div class="app-container">
    <Header />
    <Content />
  </div>
</template>

<style lang="less">
@import './assets/css/styles.less';
.app-container {
  height: 100%;
}
</style>
