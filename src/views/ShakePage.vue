<template>
  <div class="shake-page">
    <!-- 装饰背景 -->
    <div class="bg-decoration">
      <div class="bagua-symbol"></div>
      <div class="cloud-pattern cloud-1"></div>
      <div class="cloud-pattern cloud-2"></div>
      <div class="cloud-pattern cloud-3"></div>
    </div>

    <div class="content-wrapper">
      <h1 class="page-title">
        <span class="title-deco">☯</span>
        六爻起卦
        <span class="title-deco">☯</span>
      </h1>

      <!-- 问题输入 -->
      <div v-show="store.currentStep === 'input'" class="section">
        <label class="input-label">所问何事</label>
        <textarea
          v-model="question"
          class="q-input"
          :placeholder="placeholderText"
          maxlength="200"
          rows="3"
          @focus="showTips = true"
          @blur="showTips = false"
        />
        <div class="input-footer">
          <span class="word-count">{{ question.length }}/200</span>
          <transition name="fade">
            <span v-if="showTips && question.length === 0" class="tips">
              💡 示例：近期事业发展如何？
            </span>
          </transition>
        </div>
      </div>

      <!-- 摇卦区域 -->
      <div class="section shake-area">
        <!-- 未开始 -->
        <template v-if="store.currentStep === 'input'">
          <div class="start-hint">
            <p>心诚则灵，静心思考所求之事</p>
            <p class="hint-sub">填写问题后点击下方按钮开始摇卦</p>
          </div>
          <button class="btn btn-start" :disabled="!question.trim()" @click="handleStart">
            <span class="btn-icon">☯</span>
            开始摇卦
          </button>
        </template>

        <!-- 摇卦中 -->
        <template v-if="store.currentStep === 'shaking'">
          <div class="shake-progress">
            <div class="progress-text">{{ store.currentShakeIndex === 0 ? '准备摇卦...' : `已完成 ${store.currentShakeIndex} / 6 次` }}</div>
            <div class="progress-dots">
              <span v-for="n in 6" :key="n" class="dot" :class="{ done: n <= store.currentShakeIndex }">
                <span class="dot-inner"></span>
              </span>
            </div>
          </div>

          <div class="coin-stage">
            <div class="turtle-shell" :class="{ shaking: animating }">
              <div class="shell-pattern">
                <div class="hexagon center"></div>
                <div class="hexagon top"></div>
                <div class="hexagon bottom"></div>
                <div class="hexagon left-top"></div>
                <div class="hexagon left-bottom"></div>
                <div class="hexagon right-top"></div>
                <div class="hexagon right-bottom"></div>
              </div>
              <div class="coins-container" :class="{ shaking: animating }">
              <div class="copper-coin" v-for="i in 3" :key="i" :class="getCoinClass(i)"></div>
            </div>
            </div>
            <transition name="fade">
              <div v-if="lastBack !== null && !animating" class="last-result">
                <div class="coins-display">
                  <div class="mini-coin" v-for="(side, i) in coinSides" :key="i" :class="side ? 'front' : 'back'">
                    <span v-if="side" class="coin-text">乾</span>
                    <span v-else class="coin-hole"></span>
                  </div>
                </div>
                <div class="result-badge">
                  <span class="back-num">{{ lastBack }}</span>
                  <span class="back-label">背面</span>
                </div>
                <span class="yao-line" :class="getLineClass(lastBack)"></span>
                <span class="dong-tag" v-if="lastBack === 0">×</span>
                <span class="dong-tag" v-else-if="lastBack === 3">○</span>
                <span class="yao-type">{{ getYaoType(lastBack) }}</span>
              </div>
            </transition>
          </div>

          <div class="auto-hint" v-if="!animating && store.currentShakeIndex < 6">
            <span class="shake-spin">⚡</span> 自动摇卦中...
          </div>
        </template>

        <!-- 摇完 -->
        <template v-if="store.currentStep === 'result'">
          <h3 class="result-heading">✨ 起卦完成</h3>
          <div class="yao-table">
            <div class="yao-header">
              <span>爻位</span><span>背面</span><span>爻象</span><span>校正</span>
            </div>
            <div
              v-for="(row, i) in displayRows"
              :key="i"
              class="yao-row"
              :class="{ 'yao-dong': row.isDong }"
            >
              <span class="y-pos">{{ row.label }}</span>
              <span class="y-bk">{{ row.back }}</span>
              <span class="y-sym">
                <span class="yao-line" :class="row.back === 0 || row.back === 2 ? 'yin' : 'yang'"></span>
                <span v-if="row.back === 0" class="dong-tag small dong-x">×</span>
                <span v-else-if="row.back === 3" class="dong-tag small dong-o">○</span>
              </span>
              <select
                class="y-corr"
                :value="row.back"
                @change="e => store.setManualYao(row.storeIndex, +e.target.value)"
              >
                <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
          </div>
          <button class="btn btn-result" @click="handleResult">
            <span class="btn-icon">☰</span>
            开始解卦
          </button>
        </template>
      </div>

      <!-- 手动排卦 -->
      <div v-show="store.currentStep === 'input'" class="manual-section">
        <button class="manual-toggle" @click="showManual = !showManual">
          {{ showManual ? '▼ 收起' : '▶ 手动排卦模式' }}
        </button>
        <transition name="slide">
          <div v-if="showManual" class="manual-panel">
            <div class="manual-hint">选择每爻的背面数，快速排卦</div>
            <div v-for="i in 6" :key="i" class="manual-row">
              <span class="m-label">{{ manualLabels[i - 1] }}</span>
              <select v-model.number="manualBacks[i - 1]" class="m-select">
                <option :value="0">0 背（老阴 ╳）</option>
                <option :value="1">1 背（少阳 —）</option>
                <option :value="2">2 背（少阴 - -）</option>
                <option :value="3">3 背（老阳 ○）</option>
              </select>
            </div>
            <button class="btn btn-confirm" @click="handleManualConfirm">确定排卦</button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGuaStore } from '@/stores/guaStore'
import { useToastStore } from '@/stores/toastStore'
import { animate, stagger } from 'animejs'

const store = useGuaStore()
const toast = useToastStore()
const router = useRouter()
const question = ref(store.question || '')

onMounted(() => { store.isViewing = false })
const animating = ref(false)
const showManual = ref(false)
const showTips = ref(false)
const manualBacks = ref([0, 0, 0, 0, 0, 0])
const manualLabels = ['上爻', '五爻', '四爻', '三爻', '二爻', '初爻']
const coinSides = ref([true, true, true]) // 三枚铜钱的正反面状态，true=正面，false=背面

const placeholderText = '心中默念所求，然后在此写下问题...'
const lastBack = computed(() => {
  const a = store.yaoResults
  return a.length ? a[a.length - 1] : null
})

const displayRows = computed(() => {
  const labels = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
  return store.yaoResults.map((b, i) => ({
    storeIndex: i, label: labels[i], back: b,
    yinYang: (b === 0 || b === 2) ? '--' : '—',
    isDong: b === 0 || b === 3,
  })).reverse()
})

function getLineClass(back) { return back === 0 || back === 2 ? 'yin' : 'yang' }

function getYaoType(back) {
  const types = {
    0: '老阴',
    1: '少阳',
    2: '少阴',
    3: '老阳'
  }
  return types[back] || ''
}

function getCoinClass(index) {
  // 返回铜钱的样式类
  if (animating.value) {
    // 摇卦过程中，随机翻转
    return Math.random() > 0.5 ? 'front' : 'back'
  }
  // 摇卦结束后，根据实际状态显示
  return coinSides.value[index - 1] ? 'front' : 'back'
}

async function handleStart() {
  if (!store.setQuestion(question.value)) {
    toast.error(store.error || '请输入问题')
    return
  }
  if (!store.startShake()) {
    return
  }
  store.isViewing = false
  // 自动连续摇6次
  await nextTick()
  autoShakeLoop()
}

async function autoShakeLoop() {
  for (let i = 0; i < 6; i++) {
    await doShakeOnce()
    // 每次摇完后短暂停顿，让用户看到结果
    await new Promise(r => setTimeout(r, 800))
  }
  // 最后一次结果展示后再过渡
  await new Promise(r => setTimeout(r, 600))
  store.currentStep = 'result'
}

async function doShakeOnce() {
  animating.value = true

  // 振动反馈
  if ('vibrate' in navigator) { navigator.vibrate(30) }

  const shell = document.querySelector('.turtle-shell')
  const coins = document.querySelectorAll('.copper-coin')

  if (shell) {
    await animate(shell, {
      rotate: [
        { to: -20, duration: 60, ease: 'outQuad' },
        { to: 15, duration: 80, ease: 'inOutQuad' },
        { to: -10, duration: 80, ease: 'inOutQuad' },
        { to: 8, duration: 60, ease: 'inOutQuad' },
        { to: 0, duration: 120, ease: 'outElastic(1, .6)' }
      ],
      scale: [
        { to: 0.96, duration: 60 },
        { to: 1.02, duration: 80 },
        { to: 0.99, duration: 80 },
        { to: 1, duration: 120, ease: 'outElastic(1, .6)' }
      ]
    }).finished
  }

  if (coins.length) {
    animate(coins, {
      rotateY: [{ to: 180, duration: 120 }, { to: 360, duration: 160 }],
      delay: stagger(40),
      ease: 'inOutQuad'
    })
  }

  await new Promise(r => setTimeout(r, 400))
  animating.value = false
  coinSides.value = coinSides.value.map(() => Math.random() < 0.5)
  store.shakeNext()
}

async function handleResult() {
  if (!store.setQuestion(question.value)) {
    toast.error(store.error || '请输入问题')
    return
  }
  if (!store.buildPan()) {
    toast.error(store.error || '排卦失败，请重试')
    return
  }
  if (!store.runAnalysis()) {
    toast.error(store.error || '解卦失败，请重试')
    return
  }
  // 自动保存
  await store.saveCurrent()
  router.push('/result')
}

function handleManualConfirm() {
  if (!store.setQuestion(question.value)) {
    toast.error(store.error || '请输入问题')
    return
  }
  if (!store.startShake()) {
    return
  }
  if (!store.setManualAll(manualBacks.value)) {
    toast.error(store.error || '手动排卦设置失败')
    return
  }
}
</script>

<style scoped>
.shake-page { 
  position: relative;
  max-width: 480px; 
  margin: 0 auto; 
  padding: 24px 16px 70px;
  min-height: 100vh;
  background: linear-gradient(180deg, #fefcf8 0%, #fff9f0 100%);
}

/* ── 装饰背景 ── */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.bagua-symbol {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(192, 57, 43, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.6;
}

.bagua-symbol::before {
  content: '☯';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 120px;
  color: rgba(93, 64, 55, 0.1);
}

.cloud-pattern {
  position: absolute;
  width: 150px;
  height: 80px;
  background: radial-gradient(ellipse at center, rgba(255, 213, 79, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.cloud-1 { top: 15%; left: -20px; animation-delay: 0s; }
.cloud-2 { top: 40%; right: -30px; animation-delay: 2s; }
.cloud-3 { bottom: 20%; left: 10%; animation-delay: 4s; }

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-10px) translateX(5px); }
}

.content-wrapper {
  position: relative;
  z-index: 1;
}

/* ── 标题 ── */
.page-title {
  font: bold 32px "STKaiti","KaiTi","楷体",serif;
  text-align: center; 
  color: #5d4037; 
  margin-bottom: 32px;
  letter-spacing: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-deco {
  font-size: 28px;
  color: #c0392b;
  opacity: 0.8;
}

/* ── 输入区 ── */
.section { margin-bottom: 24px; }

.input-label {
  display: block; 
  font-size: 15px; 
  color: #8d6e63;
  margin-bottom: 8px; 
  font-family: "STKaiti","KaiTi","楷体",serif;
  font-weight: 500;
}

.q-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #d7ccc8;
  border-radius: 12px;
  font-size: 16px;
  resize: none;
  box-sizing: border-box;
  background: #fffef9;
  color: #4e342e;
  font-family: "PingFang SC","Microsoft YaHei",sans-serif;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.q-input:focus { 
  outline: none; 
  border-color: #c0392b; 
  box-shadow: 0 0 0 4px rgba(192, 57, 43, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.q-input::placeholder {
  color: #bcaaa4;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.word-count { 
  font-size: 12px; 
  color: #bcaaa4; 
}

.tips {
  font-size: 12px;
  color: #8d6e63;
  background: #fff8e1;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #ffecb3;
}

/* ── 摇卦区 ── */
.shake-area { text-align: center; }

.start-hint {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fff8e1 0%, #fff9c4 100%);
  border-radius: 12px;
  border: 1px solid #ffe082;
}

.start-hint p {
  margin: 0;
  font-size: 15px;
  color: #f57f17;
  font-family: "STKaiti","KaiTi","楷体",serif;
  line-height: 1.6;
}

.hint-sub {
  margin-top: 8px;
  font-size: 13px;
  color: #8d6e63;
}

/* ── 按钮 ── */
.btn {
  display: inline-block; 
  padding: 14px 36px; 
  font-size: 17px;
  border: none; 
  border-radius: 12px; 
  cursor: pointer; 
  min-height: 52px;
  transition: all 0.3s; 
  font-family: "STKaiti","KaiTi","楷体",serif;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed;
}

.btn:disabled::before {
  display: none;
}

.btn-icon { 
  margin-right: 8px; 
  font-size: 22px; 
}

.btn-start {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  color: #fff; 
  font-size: 19px; 
  box-shadow: 0 4px 16px rgba(192, 57, 43, 0.3);
  width: 100%; 
  padding: 18px;
}

.btn-start:not(:disabled):active { 
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(192, 57, 43, 0.3);
}

.auto-hint {
  text-align: center; color: #8d6e63; font-size: 14px;
  padding: 12px 0; font-family: "STKaiti","KaiTi","楷体",serif;
}
.shake-spin {
  display: inline-block; animation: spin-icon .8s linear infinite; font-size: 16px;
}
@keyframes spin-icon { to { transform: rotate(360deg); } }

.btn-result {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  color: #fff; 
  font-size: 18px; 
  width: 100%;
  box-shadow: 0 4px 16px rgba(46, 125, 50, 0.3);
  margin-top: 20px;
}

.btn-result:active { 
  transform: scale(0.98);
}

.btn-confirm { 
  background: linear-gradient(135deg, #5d4037 0%, #4e342e 100%);
  color: #fff; 
  margin-top: 16px; 
  width: 100%; 
  box-shadow: 0 4px 12px rgba(93, 64, 55, 0.25);
}

/* ── 进度 ── */
.shake-progress { margin-bottom: 24px; }

.progress-text { 
  font-size: 20px; 
  color: #5d4037; 
  margin-bottom: 12px;
  font-weight: 500;
}

.progress-dots { 
  display: flex; 
  justify-content: center; 
  gap: 12px; 
}

.dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #d7ccc8;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-inner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.3s;
}

.dot.done { 
  border-color: #c0392b;
  background: #fff5f5;
}

.dot.done .dot-inner {
  background: #c0392b;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* ── 龟壳摇卦 ── */
.coin-stage {
  margin: 12px 0 8px;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.turtle-shell {
  width: 120px;
  height: 95px;
  background: radial-gradient(circle at 30% 30%, #a0522d, #8b4513, #654321, #3d2817);
  border-radius: 50% 50% 45% 45%;
  border: 4px solid #2d1810;
  box-shadow: 
    0 8px 24px rgba(45, 24, 16, 0.6),
    inset 0 -6px 12px rgba(0, 0, 0, 0.4),
    inset 0 6px 12px rgba(139, 69, 19, 0.4),
    0 0 0 1px rgba(139, 69, 19, 0.2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
}

.shell-pattern {
  width: 100%;
  height: 100%;
  position: relative;
  pointer-events: none;
}

.hexagon {
  position: absolute;
  width: 22px;
  height: 22px;
  background: rgba(61, 40, 23, 0.7);
  border: 1px solid rgba(139, 69, 19, 0.6);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);
}

.hexagon.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  background: rgba(139, 69, 19, 0.5);
}

.hexagon.top {
  top: 12%;
  left: 50%;
  transform: translateX(-50%);
}

.hexagon.bottom {
  bottom: 18%;
  left: 50%;
  transform: translateX(-50%);
}

.hexagon.left-top {
  top: 28%;
  left: 22%;
}

.hexagon.left-bottom {
  bottom: 32%;
  left: 22%;
}

.hexagon.right-top {
  top: 28%;
  right: 22%;
}

.hexagon.right-bottom {
  bottom: 32%;
  right: 22%;
}

/* 三枚铜钱 */
.coins-container {
  position: absolute;
  width: 85px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.copper-coin {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #8b6914;
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 3px rgba(255, 255, 255, 0.5),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

/* 正面 - 有字的一面 */
.copper-coin.front {
  background: radial-gradient(circle at 35% 35%, #ffd54f, #ffb300, #b8860b);
}

.copper-coin.front::before {
  content: '乾';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  font-weight: bold;
  color: #8B4513;
  font-family: "STKaiti","KaiTi","楷体",serif;
  width: auto;
  height: auto;
  background: transparent;
  border: none;
  box-shadow: none;
}

.copper-coin.front::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgba(139, 69, 19, 0.3);
}

/* 反面 - 有图案的一面 */
.copper-coin.back {
  background: radial-gradient(circle at 35% 35%, #c9a35f, #a67c52, #8b6f47);
}

.copper-coin.back::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  background: #654321;
  border: 1px solid #3d2817;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.3);
}

.copper-coin.back::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
}

.turtle-shell.shaking {
  animation: turtle-shake .8s ease-in-out;
}

.coins-container.shaking .copper-coin:nth-child(1) {
  animation: coin-flip-1 .8s ease-in-out;
}

.coins-container.shaking .copper-coin:nth-child(2) {
  animation: coin-flip-2 .8s ease-in-out;
}

.coins-container.shaking .copper-coin:nth-child(3) {
  animation: coin-flip-3 .8s ease-in-out;
}

@keyframes turtle-shake {
  0% { transform: rotate(0deg) translateX(0) translateY(0); }
  15% { transform: rotate(-18deg) translateX(-10px) translateY(-5px); }
  30% { transform: rotate(15deg) translateX(8px) translateY(-3px); }
  45% { transform: rotate(-12deg) translateX(-7px) translateY(-2px); }
  60% { transform: rotate(10deg) translateX(5px) translateY(-1px); }
  75% { transform: rotate(-6deg) translateX(-4px) translateY(0); }
  90% { transform: rotate(4deg) translateX(2px) translateY(0); }
  100% { transform: rotate(0deg) translateX(0) translateY(0); }
}

@keyframes coin-flip-1 {
  0% { transform: translate(0, 0) rotateY(0deg) rotateX(0deg); }
  15% { transform: translate(-8px, -12px) rotateY(90deg) rotateX(45deg); }
  30% { transform: translate(6px, -10px) rotateY(180deg) rotateX(-30deg); }
  50% { transform: translate(-6px, -8px) rotateY(270deg) rotateX(60deg); }
  70% { transform: translate(4px, -5px) rotateY(360deg) rotateX(-20deg); }
  85% { transform: translate(-3px, -2px) rotateY(450deg) rotateX(30deg); }
  100% { transform: translate(0, 0) rotateY(540deg) rotateX(0deg); }
}

@keyframes coin-flip-2 {
  0% { transform: translate(0, 0) rotateY(0deg) rotateX(0deg); }
  20% { transform: translate(5px, -13px) rotateY(120deg) rotateX(-50deg); }
  40% { transform: translate(-7px, -9px) rotateY(240deg) rotateX(40deg); }
  60% { transform: translate(3px, -6px) rotateY(360deg) rotateX(-25deg); }
  80% { transform: translate(-2px, -3px) rotateY(480deg) rotateX(15deg); }
  100% { transform: translate(0, 0) rotateY(600deg) rotateX(0deg); }
}

@keyframes coin-flip-3 {
  0% { transform: translate(0, 0) rotateY(0deg) rotateX(0deg); }
  18% { transform: translate(7px, -11px) rotateY(150deg) rotateX(55deg); }
  36% { transform: translate(-6px, -14px) rotateY(300deg) rotateX(-35deg); }
  54% { transform: translate(9px, -7px) rotateY(450deg) rotateX(45deg); }
  72% { transform: translate(-4px, -4px) rotateY(600deg) rotateX(-18deg); }
  100% { transform: translate(0, 0) rotateY(720deg) rotateX(0deg); }
}

.last-result { 
  text-align: center; 
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.coins-display {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.mini-coin {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #8b6914;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.mini-coin.front {
  background: radial-gradient(circle at 35% 35%, #ffd54f, #ffb300, #b8860b);
}

.mini-coin.back {
  background: radial-gradient(circle at 35% 35%, #c9a35f, #a67c52, #8b6f47);
}

.coin-text {
  font-size: 11px;
  font-weight: bold;
  color: #8B4513;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

.coin-hole {
  width: 8px;
  height: 8px;
  background: #654321;
  border: 1px solid #3d2817;
  border-radius: 1px;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fff8e1 0%, #fff9c4 100%);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #ffe082;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
}

.back-num { 
  font-size: 32px; 
  font-weight: bold; 
  color: #c0392b;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

.back-label { 
  font-size: 15px; 
  color: #8d6e63;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

/* ── 爻线（CSS 渲染，阳爻直线 / 阴爻虚线，等宽） ── */
.yao-line {
  display: inline-block; vertical-align: middle;
  width: 40px; height: 5px; border-radius: 3px;
}
.yao-line.yang { background: #c0392b; }
.yao-line.yin {
  background: linear-gradient(to right,
    #1565c0 0%, #1565c0 42%,
    transparent 42%, transparent 58%,
    #1565c0 58%, #1565c0 100%);
}

/* ── 动爻标记 ── */
.dong-tag {
  display: inline-block; vertical-align: middle;
  font-size: 18px; font-weight: bold; font-family: "STKaiti","KaiTi","楷体",serif;
  margin-left: 6px; color: #e65100;
}
.dong-tag.small { font-size: 14px; margin-left: 4px; }
.dong-tag.dong-x { color: #1565c0; }
.dong-tag.dong-o { color: #c0392b; }

.yao-type {
  font-size: 16px;
  color: #8d6e63;
  background: #fff;
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid #d7ccc8;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

.fade-enter-active { 
  transition: opacity .4s ease, transform .4s ease; 
}

.fade-enter-from { 
  opacity: 0; 
  transform: translateY(-10px);
}

/* ── 卦表 ── */
.result-heading {
  font: bold 20px "STKaiti","KaiTi","楷体",serif;
  color: #5d4037; 
  margin-bottom: 16px;
}

.yao-table {
  border: 2px solid #d7ccc8; 
  border-radius: 12px; 
  overflow: hidden;
  background: #fffef9; 
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.yao-header {
  display: grid; 
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 4px; 
  padding: 10px 12px; 
  background: linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%);
  font-size: 14px; 
  color: #5d4037; 
  text-align: center;
  font-weight: 500;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

.yao-row {
  display: grid; 
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 4px; 
  align-items: center; 
  padding: 12px 12px;
  border-bottom: 1px solid #f5f0e8; 
  text-align: center;
  transition: background 0.2s;
}

.yao-row:last-child { 
  border-bottom: none; 
}

.yao-row.yao-dong { 
  background: linear-gradient(90deg, #fff8e1 0%, #fff9c4 100%); 
}

.y-pos { 
  font-size: 15px; 
  color: #5d4037; 
  font-family: "STKaiti","KaiTi","楷体",serif;
  font-weight: 500;
}

.y-bk { 
  font-size: 15px; 
  color: #4e342e; 
  font-weight: 600;
}

.y-sym {
  display: flex; align-items: center; justify-content: center; gap: 2px;
}
.y-sym .yao-line { width: 32px; height: 4px; }

.y-corr { 
  padding: 6px 10px; 
  border: 2px solid #d7ccc8; 
  border-radius: 8px; 
  font-size: 14px; 
  background: #fff; 
  min-height: 36px; 
  cursor: pointer;
  transition: all 0.2s;
}

.y-corr:focus {
  border-color: #c0392b;
  outline: none;
}

/* ── 手动排卦 ── */
.manual-section { 
  text-align: center; 
  padding-bottom: 12px; 
}

.manual-toggle { 
  background: none; 
  border: none; 
  color: #8d6e63; 
  font-size: 14px; 
  cursor: pointer;
  font-family: "STKaiti","KaiTi","楷体",serif;
  transition: color 0.2s;
}

.manual-toggle:hover {
  color: #5d4037;
}

.manual-panel {
  margin-top: 16px; 
  padding: 20px; 
  background: linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%);
  border-radius: 12px; 
  text-align: left;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.manual-hint {
  font-size: 13px;
  color: #8d6e63;
  margin-bottom: 16px;
  text-align: center;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

.manual-row { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  margin-bottom: 12px;
}

.m-label { 
  font-size: 14px; 
  color: #5d4037;
  font-family: "STKaiti","KaiTi","楷体",serif;
}

.m-select { 
  padding: 8px 12px; 
  font-size: 14px; 
  border: 2px solid #bcaaa4; 
  border-radius: 8px; 
  min-height: 44px; 
  min-width: 160px; 
  background: #fff; 
  cursor: pointer;
  transition: all 0.2s;
  font-family: "PingFang SC","Microsoft YaHei",sans-serif;
}

.m-select:focus {
  border-color: #c0392b;
  outline: none;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 移动端优化 */
@media (max-width: 480px) {
  .shake-page {
    padding: 20px 12px 80px;
  }
  
  .page-title {
    font-size: 28px;
    margin-bottom: 24px;
  }
  
  .q-input {
    font-size: 15px;
  }
  
  .turtle-shell {
    width: 100px;
    height: 80px;
  }
  
  .copper-coin {
    width: 20px;
    height: 20px;
  }
}
</style>
