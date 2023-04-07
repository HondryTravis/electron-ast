<template>
  <div class="record-items">
    <div class="record-item">
      <span class="record-index">ID</span>
      <span class="record-time">保存时间</span>
      <span class="record-content">HTML 内容</span>
      <span class="record-content">JSON 内容</span>
    </div>
    <div class="record-operate">
      <span>操作</span>
    </div>
  </div>
  <div v-show="!context.length" class="empty-content">暂无数据</div>
  <template v-for="item of context" :key="item.id">
    <section>
      <div class="record-items">
        <div class="record-item">
          <span class="record-index">{{ item.id }}</span>
          <span class="record-time">{{ new Date(item.timestamp).toLocaleString() }} </span>
          <span class="record-content">{{ item.detail.html }}</span>
          <span class="record-content">{{ item.detail.json }}</span>
        </div>
        <div class="record-operate">
          <span class="button" @click="handleRecord($event, item.id)">恢复</span>
        </div>
      </div>
    </section>
  </template>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { emitter } from '@renderer/utils'
import { LOCAL_DB_STORE_NAME } from '@renderer/const'

const context = ref([])
const router = useRouter()

async function getAllData() {
  await window.LOCAL_DB.openDatabase(1)
  const list = await window.LOCAL_DB.getAll(LOCAL_DB_STORE_NAME)

  context.value = list
}

getAllData()

function handleRecord(event, id) {
  const item = context.value.find((item) => item.id == id)

  emitter.emit('RecordEvent', {
    type: 'click',
    target: item,
    currentTarget: 'Record'
  })

  router.push('/')
}
</script>

<style lang="less">
.record-items {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  height: 50px;
}

.record-item {
  flex: 2;
  display: flex;
  align-items: center;
  color: var(--color-e8eaed);

  .record-index {
    width: 50px;
  }

  .record-time {
    width: 150px;
  }

  .record-content {
    width: 240px;
  }

  & > span {
    display: inline-block;
    padding: 0 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.record-operate {
  flex: 1;
  display: flex;
  justify-content: center;

  & > span.button {
    display: inline-block;
    padding: 5px;
    user-select: none;
    border-radius: 5px;
    cursor: pointer;

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

.empty-content {
  justify-content: center;
  align-items: center;
  display: flex;
}
</style>
