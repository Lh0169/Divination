<template>
  <div class="history-page">
    <div class="header">
      <h1 class="title">卦例记录</h1>
      <span v-if="store.history.length" class="badge">{{ store.history.length }}</span>
      <button v-if="store.history.length" class="clear-btn" @click="showConfirm = true">清空</button>
    </div>

    <!-- 空 -->
    <div v-if="store.history.length === 0" class="empty">
      <div class="empty-icon">📜</div>
      <p class="empty-text">暂无卦例，去摇一卦吧</p>
      <button class="go-btn" @click="router.push('/')">开始摇卦</button>
    </div>

    <!-- 列表 -->
    <div v-else class="list">
      <div
        v-for="record in store.history"
        :key="record.id"
        class="record-card"
        @click="openRecord(record)"
      >
        <div class="card-main">
          <div class="card-q">{{ truncate(record.guaPan?.question, 28) }}</div>
          <div class="card-meta">
            <span class="meta-gua">{{ record.guaPan?.benGuaName || '?' }} → {{ record.guaPan?.bianGuaName || '?' }}</span>
            <span class="meta-time">{{ fmt(record.createdAt) }}</span>
          </div>
        </div>
        <button class="del-btn" @click.stop="del(record.id)" title="删除">×</button>
      </div>
    </div>

    <!-- 确认 -->
    <div v-if="showConfirm" class="overlay" @click="showConfirm = false">
      <div class="dialog" @click.stop>
        <p>确定清空全部记录？</p>
        <div class="dialog-btns">
          <button class="d-cancel" @click="showConfirm = false">取消</button>
          <button class="d-ok" @click="handleClearAll">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGuaStore } from '@/stores/guaStore'
import { useToastStore } from '@/stores/toastStore'
import { useRouter } from 'vue-router'
import { deleteRecord as storageDelete, clearAll as storageClearAll } from '@/utils/storage'

const store = useGuaStore()
const toast = useToastStore()
const router = useRouter()
const showConfirm = ref(false)

onMounted(() => store.loadHistory())

function truncate(t, max) {
  if (!t) return '（未记录问题）'
  return t.length > max ? t.slice(0, max) + '…' : t
}

function fmt(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } catch {
    return ''
  }
}

function openRecord(rec) {
  try {
    if (!store.viewRecord(rec)) {
      toast.error(store.error || '记录数据损坏')
      return
    }
    router.push('/result')
  } catch (error) {
    console.error('打开记录失败:', error)
    toast.error('打开记录失败')
  }
}

function del(id) {
  try {
    storageDelete(id)
    store.loadHistory()
    toast.success('已删除')
  } catch (error) {
    console.error('删除记录失败:', error)
    toast.error('删除失败，请重试')
  }
}

function handleClearAll() {
  try {
    storageClearAll()
    store.loadHistory()
    showConfirm.value = false
    toast.success('已清空所有记录')
  } catch (error) {
    console.error('清空记录失败:', error)
    toast.error('清空失败，请重试')
  }
}
</script>

<style scoped>
.history-page { max-width: 480px; margin: 0 auto; padding: 24px 16px 80px; min-height: 100vh; }
.header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.title { font: bold 26px "STKaiti","KaiTi","楷体",serif; color: #5d4037; margin: 0; letter-spacing: 2px; }
.badge { background: #c0392b; color: #fff; font-size: 12px; border-radius: 10px; padding: 2px 10px; min-width: 22px; text-align: center; }
.clear-btn { margin-left: auto; background: none; border: 1px solid #d7ccc8; border-radius: 6px; padding: 4px 14px; font-size: 13px; color: #8d6e63; cursor: pointer; }

.empty { text-align: center; padding: 80px 0; }
.empty-icon { font-size: 40px; margin-bottom: 12px; opacity: .5; }
.empty-text { color: #8d6e63; font-size: 15px; margin-bottom: 16px; }
.go-btn { background: #c0392b; color: #fff; border: none; border-radius: 8px; padding: 10px 28px; font-size: 16px; cursor: pointer; font-family: "STKaiti","KaiTi","楷体",serif; }

.list { display: flex; flex-direction: column; gap: 10px; }
.record-card {
  display: flex; align-items: stretch; border-radius: 10px;
  background: #fffef9; overflow: hidden; cursor: pointer;
  border: 1px solid #efebe9; box-shadow: 0 1px 4px rgba(93,64,55,.06);
  transition: box-shadow .15s;
}
.record-card:active { box-shadow: 0 2px 8px rgba(93,64,55,.12); }
.card-main { flex: 1; padding: 14px 16px; min-width: 0; }
.card-q { font-size: 15px; font-weight: 500; color: #4e342e; margin-bottom: 6px; }
.card-meta { display: flex; justify-content: space-between; font-size: 12px; color: #8d6e63; }
.meta-gua { color: #c0392b; font-family: "STKaiti","KaiTi","楷体",serif; }
.del-btn {
  width: 40px; min-width: 40px; background: none; color: #bcaaa4; border: none;
  font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: color .15s; flex-shrink: 0;
}
.del-btn:hover { color: #e74c3c; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 200; }
.dialog { background: #fffef9; border-radius: 12px; padding: 24px 28px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
.dialog p { margin: 0 0 20px; font-size: 16px; color: #4e342e; }
.dialog-btns { display: flex; gap: 12px; justify-content: center; }
.dialog-btns button { padding: 8px 24px; border-radius: 8px; border: none; font-size: 14px; cursor: pointer; }
.d-cancel { background: #efebe9; color: #5d4037; }
.d-ok { background: #c0392b; color: #fff; }
</style>
