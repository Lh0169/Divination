<template>
  <div id="app-container">
    <router-view />
    <Toast />
    <nav class="tab-bar" v-if="showTabBar">
      <router-link to="/" class="tab-item" active-class="tab-active">
        <span class="tab-icon">☰</span>
        <span class="tab-label">摇卦</span>
      </router-link>
      <router-link to="/history" class="tab-item" active-class="tab-active">
        <span class="tab-icon">📋</span>
        <span class="tab-label">历史</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Toast from '@/components/ui/Toast.vue';

const route = useRoute();
const showTabBar = computed(() => route.path !== '/result');
</script>

<style>
#app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-bg, #f5f0e8);
  position: relative;
  padding-bottom: 70px;
}
.tab-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  max-width: 480px; width: 100%;
  display: flex; justify-content: space-around; align-items: center;
  background: var(--color-surface, #fff);
  border-top: 1px solid var(--color-border, #ddd);
  padding: 8px 0; z-index: 100;
}
.tab-item { text-decoration: none; color: #999; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 16px; }
.tab-active { color: #c0392b; }
.tab-icon { font-size: 20px; }
.tab-label { font-size: 12px; }
</style>
