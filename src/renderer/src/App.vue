<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style lang="less">
@import './assets/css/styles.less';
.app-container {
  height: 100%;
}

// .app-container::before {
//   content: '';
//   position: absolute;
//   background-color: #2f3241;
//   z-index: 0;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   filter: blur(5px);
// }
</style>
