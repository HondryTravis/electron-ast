<template>
  <div class="app-container">
    <Header />
    <RouterView />
  </div>
</template>

<script setup>
import Header from '@renderer/components/Header.vue'
</script>

<style lang="less">
@import '@renderer/assets/css/styles.less';
.app-container {
  height: 100%;
}
</style>
