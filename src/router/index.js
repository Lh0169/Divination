import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'shake', component: () => import('@/views/ShakePage.vue'), meta: { title: '摇卦' } },
  { path: '/result', name: 'result', component: () => import('@/views/ResultPage.vue'), meta: { title: '卦盘' } },
  { path: '/history', name: 'history', component: () => import('@/views/HistoryPage.vue'), meta: { title: '历史' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({ history: createWebHistory(), routes });
export default router;
