<template>
  <teleport to="body">
    <div class="toast-container" aria-live="polite">
      <transition-group name="toast">
        <div
          v-for="item in store.items"
          :key="item.id"
          class="toast-item"
          :class="'toast-' + item.type"
          @click="store.remove(item.id)"
        >
          <span class="toast-icon">{{ iconMap[item.type] }}</span>
          <span class="toast-msg">{{ item.message }}</span>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toastStore'

const store = useToastStore()
const iconMap = { success: '✓', error: '✕', info: 'ℹ' }
</script>

<style scoped>
.toast-container {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; flex-direction: column; gap: 8px;
  max-width: 400px; width: calc(100% - 32px); pointer-events: none;
}
.toast-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 10px;
  font-size: 14px; color: #fff; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  pointer-events: auto; backdrop-filter: blur(8px);
}
.toast-success { background: rgba(46,125,50,.92); }
.toast-error   { background: rgba(198,40,40,.92); }
.toast-info    { background: rgba(93,64,55,.92); }
.toast-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
.toast-msg  { flex: 1; line-height: 1.4; }

.toast-enter-active { transition: all .3s ease; }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-16px) scale(.95); }
.toast-leave-to     { opacity: 0; transform: translateY(-8px) scale(.95); }
</style>
