<template>
  <div class="page">
    <!-- 空状态 -->
    <div v-if="!store.guaPan" class="empty-state">
      <div class="empty-icon">☯</div>
      <p class="empty-text">请先摇卦，才能查看卦盘</p>
      <button class="btn btn-primary" @click="goShake">去摇卦</button>
    </div>

    <!-- 卦盘结果 -->
    <template v-else>
      <!-- 卦图 Canvas -->
      <div ref="canvasContainer" class="canvas-wrap" />

      <!-- 解卦分析卡片 -->
      <div v-if="analysis" class="analysis-section">
        <!-- 用神 -->
        <FadeContent :duration="600" :delay="100">
          <SpotlightCard
            class="card card-yongshen"
            spotlight-color="rgba(192, 57, 43, 0.12)"
          >
            <div class="card-head">
              <span class="head-icon">用</span>
              <span class="head-label">用神定位</span>
            </div>
            <div class="ys-row">
              <span class="ys-label">{{ analysis.yongShen || '未取' }}</span>
              <span class="badge" :class="strengthClass(analysis.strength)">{{ analysis.strength }}</span>
              <span v-if="analysis.isFuShen" class="badge badge-fushen">伏藏</span>
            </div>
            <div class="ys-relation" v-if="analysis.relationToShi">世应关系：{{ analysis.relationToShi }}</div>
          </SpotlightCard>
        </FadeContent>

        <!-- 原忌仇神 -->
        <FadeContent :duration="600" :delay="200" v-if="analysis.yuanShen || analysis.jiShen || analysis.chouShen">
          <SpotlightCard
            class="card"
            spotlight-color="rgba(93, 64, 55, 0.08)"
          >
            <div class="card-head">
              <span class="head-icon">神</span>
              <span class="head-label">六亲配置</span>
            </div>
            <div class="three-row">
              <div class="three-item sheng"><span>原神</span><strong>{{ analysis.yuanShen || '—' }}</strong></div>
              <div class="three-item ke"><span>忌神</span><strong>{{ analysis.jiShen || '—' }}</strong></div>
              <div class="three-item chou"><span>仇神</span><strong>{{ analysis.chouShen || '—' }}</strong></div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <!-- 动爻影响 -->
        <FadeContent :duration="600" :delay="300" v-if="analysis.dongYaoEffects && analysis.dongYaoEffects.length">
          <SpotlightCard
            class="card"
            spotlight-color="rgba(230, 81, 0, 0.08)"
          >
            <div class="card-head">
              <span class="head-icon">动</span>
              <span class="head-label">动爻变化</span>
            </div>
            <ul class="list">
              <li v-for="(eff, i) in analysis.dongYaoEffects" :key="i">{{ eff }}</li>
            </ul>
          </SpotlightCard>
        </FadeContent>

        <!-- 格局 -->
        <FadeContent :duration="600" :delay="400" v-if="analysis.patterns && analysis.patterns.length">
          <SpotlightCard
            class="card card-pattern"
            spotlight-color="rgba(230, 81, 0, 0.06)"
          >
            <div class="card-head">
              <span class="head-icon">格</span>
              <span class="head-label">卦象格局</span>
            </div>
            <div class="pattern-list">
              <span v-for="p in analysis.patterns" :key="p" class="pattern-tag">{{ p }}</span>
            </div>
          </SpotlightCard>
        </FadeContent>

        <!-- 神煞 -->
        <FadeContent :duration="600" :delay="500" v-if="analysis.shenShaEffects && analysis.shenShaEffects.length">
          <SpotlightCard
            class="card"
            spotlight-color="rgba(100, 100, 100, 0.06)"
          >
            <div class="card-head">
              <span class="head-icon">煞</span>
              <span class="head-label">神煞提示</span>
            </div>
            <ul class="list">
              <li v-for="(ss, i) in analysis.shenShaEffects" :key="i">{{ ss }}</li>
            </ul>
          </SpotlightCard>
        </FadeContent>

        <!-- 应期 -->
        <FadeContent :duration="600" :delay="600" v-if="analysis.yingQiCandidates && analysis.yingQiCandidates.length">
          <SpotlightCard
            class="card"
            spotlight-color="rgba(46, 125, 50, 0.08)"
          >
            <div class="card-head">
              <span class="head-icon">期</span>
              <span class="head-label">应期参考</span>
            </div>
            <ul class="list">
              <li v-for="(yq, i) in analysis.yingQiCandidates" :key="i">{{ yq }}</li>
            </ul>
          </SpotlightCard>
        </FadeContent>

        <!-- 断语 -->
        <FadeContent :duration="800" :delay="700" v-if="analysis.conclusion">
          <SpotlightCard
            class="card card-conclusion"
            spotlight-color="rgba(192, 57, 43, 0.08)"
          >
            <div class="card-head">
              <span class="head-icon">断</span>
              <span class="head-label">白话断语</span>
            </div>
            <p class="conclusion-text">{{ analysis.conclusion }}</p>
          </SpotlightCard>
        </FadeContent>
      </div>

      <!-- 操作 -->
      <div class="action-bar">
        <button class="act-btn" @click="handleExportPNG">导出 PNG</button>
        <button class="act-btn" @click="handleExportPDF">导出 PDF</button>
        <button v-if="store.isViewing" class="act-btn" @click="handleBack">返回历史</button>
        <button v-else class="act-btn" @click="handleReset">重新摇卦</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useGuaStore } from '@/stores/guaStore'
import { useToastStore } from '@/stores/toastStore'
import { exportToCanvas, exportPNG, exportPDF } from '@/renderer/canvasRenderer'
import { useRouter } from 'vue-router'
import FadeContent from '@/components/ui/FadeContent.vue'
import SpotlightCard from '@/components/ui/SpotlightCard.vue'

const store = useGuaStore()
const toast = useToastStore()
const router = useRouter()
const canvasContainer = ref(null)
const analysis = computed(() => store.analysis)

function strengthClass(s) {
  return s === '旺' ? 'badge-wang' : s === '衰' ? 'badge-shuai' : 'badge-ping'
}
function goShake() { router.push('/') }

onMounted(async () => {
  await nextTick()
  if (!store.guaPan || !canvasContainer.value) return
  // 清空旧 canvas
  canvasContainer.value.innerHTML = ''
  const canvas = exportToCanvas(store.guaPan)
  if (canvas) canvasContainer.value.appendChild(canvas)
})

function handleExportPNG() {
  try {
    if (!store.guaPan) {
      toast.error('没有可导出的卦盘')
      return
    }
    exportPNG(store.guaPan)
    toast.success('PNG 图片已开始下载')
  } catch (error) {
    console.error('导出 PNG 失败:', error)
    toast.error('导出 PNG 失败，请重试')
  }
}

function handleExportPDF() {
  try {
    if (!store.guaPan) {
      toast.error('没有可导出的卦盘')
      return
    }
    exportPDF(store.guaPan)
    toast.success('PDF 导出成功')
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    toast.error('导出 PDF 失败，请检查浏览器弹窗设置')
  }
}

async function handleSave() {
  if (!store.guaPan) {
    toast.error('没有可保存的卦盘')
    return
  }
  try {
    const result = await store.saveCurrent()
    if (result.success) {
      toast.success('保存成功')
    } else {
      toast.error(result.error || '保存失败，请重试')
    }
  } catch (error) {
    console.error('保存失败:', error)
    toast.error('保存失败，请重试')
  }
}

function handleReset() {
  store.reset()
  router.push('/')
}

function handleBack() {
  router.push('/history')
}

</script>

<style scoped>
.page { max-width: 480px; margin: 0 auto; padding: 20px 16px 80px; min-height: 100vh; }

/* ── 空状态 ── */
.empty-state { text-align: center; padding: 100px 0; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .4; }
.empty-text { font-size: 16px; color: #8d6e63; margin-bottom: 20px; }
.btn-primary { background: #c0392b; color: #fff; border: none; border-radius: 8px; padding: 12px 32px; font-size: 16px; cursor: pointer; }

/* ── Canvas ── */
.canvas-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
.canvas-wrap :deep(canvas) { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 16px rgba(0,0,0,.1); background: #fffef9; }

/* ── 卡片 ── */
.analysis-section { display: flex; flex-direction: column; gap: 12px; }
.card {
  background: #fffef9; border-radius: 10px;
  padding: 14px 16px; box-shadow: 0 2px 8px rgba(93,64,55,.08);
  border: 1px solid #efebe9;
}
.card-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px; padding-bottom: 8px;
  border-bottom: 1px dashed #d7ccc8;
}
.head-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 4px;
  background: #c0392b; color: #fff; font-size: 13px; font-weight: bold;
}
.head-label { font: bold 14px "STKaiti","KaiTi","楷体",serif; color: #5d4037; }

/* ── 用神 ── */
.ys-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.ys-label { font-size: 20px; font-weight: 700; color: #4e342e; }
.ys-relation { font-size: 13px; color: #8d6e63; }

.badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; }
.badge-wang { background: #e8f5e9; color: #2e7d32; }
.badge-shuai { background: #fce4ec; color: #c62828; }
.badge-ping { background: #f5f5f5; color: #757575; }
.badge-fushen { background: #e3f2fd; color: #1565c0; }

/* ── 三神 ── */
.three-row { display: flex; gap: 12px; }
.three-item { flex: 1; text-align: center; padding: 8px; border-radius: 6px; }
.three-item span { display: block; font-size: 11px; color: #8d6e63; margin-bottom: 2px; }
.three-item strong { font-size: 15px; color: #4e342e; }
.three-item.sheng { background: #e8f5e9; }
.three-item.ke { background: #fce4ec; }
.three-item.chou { background: #fff3e0; }

/* ── 列表 ── */
.list { margin: 0; padding-left: 18px; font-size: 14px; color: #5d4037; line-height: 1.8; }

/* ── 格局 ── */
.pattern-list { display: flex; flex-wrap: wrap; gap: 8px; }
.card-pattern .pattern-tag {
  display: inline-block; padding: 4px 16px; border-radius: 12px;
  font-size: 14px; font-weight: 600; background: #fff3e0; color: #e65100;
}

/* ── 断语 ── */
.card-conclusion { border-left: 4px solid #c0392b; background: #fefcf5; }
.conclusion-text { font-size: 15px; line-height: 1.9; color: #4e342e; margin: 0; white-space: pre-line; }

/* ── 操作 ── */
.action-bar { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
.act-btn {
  flex: 1; min-width: 70px; padding: 10px 0;
  border: 1px solid #d7ccc8; border-radius: 8px;
  font-size: 13px; cursor: pointer; background: #fffef9;
  color: #5d4037; transition: all .2s;
  font-family: "STKaiti","KaiTi","楷体",serif;
}
.act-btn:hover { background: #f5f0e8; border-color: #c0392b; color: #c0392b; }
.act-btn:active { transform: scale(.97); }
</style>
