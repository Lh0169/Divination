import { defineStore } from 'pinia'
import { buildGuaPan, resolveFuShen } from '@/engine/paipan'
import { analyze } from '@/engine/analyze'
import { shakeOnce } from '@/utils/shake'
import { saveRecord, getRecords, deleteRecord as delRecord } from '@/utils/storage'

export const useGuaStore = defineStore('gua', {
  state: () => ({
    currentStep: 'input',
    question: '',
    yaoResults: [],
    currentShakeIndex: 0,
    guaPan: null,
    analysis: null,
    history: [],
    isLoading: false,
    error: null,
    isViewing: false,
  }),

  getters: {
    isShakingComplete: (state) => state.yaoResults.length === 6,
    canAnalyze: (state) => state.guaPan !== null,
    hasError: (state) => state.error !== null,
  },

  actions: {
    setQuestion(q) {
      // 输入验证和清理
      if (typeof q !== 'string') {
        this.error = '问题必须是文本'
        return false
      }
      const trimmed = q.trim()
      if (trimmed.length === 0) {
        this.error = '请输入您要占卜的问题'
        return false
      }
      if (trimmed.length > 200) {
        this.error = '问题长度不能超过200字'
        return false
      }
      // 简单的 XSS 防护
      const sanitized = trimmed
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
      this.question = sanitized
      this.error = null
      return true
    },

    clearError() {
      this.error = null
    },

    startShake() {
      // 验证问题是否已设置
      if (!this.question || this.question.trim().length === 0) {
        this.error = '请先输入问题'
        return false
      }
      this.yaoResults = []
      this.currentShakeIndex = 0
      this.guaPan = null
      this.analysis = null
      this.currentStep = 'shaking'
      this.error = null
      return true
    },

    shakeNext() {
      if (this.currentShakeIndex >= 6) return
      const backCount = shakeOnce()
      this.yaoResults = [...this.yaoResults, backCount]
      this.currentShakeIndex++
      if (this.currentShakeIndex === 6) {
        this.currentStep = 'result'
      }
    },

    setManualYao(index, backCount) {
      if (index < 0 || index > 5) return false
      if (backCount < 0 || backCount > 3) return false
      const copy = [...this.yaoResults]
      copy[index] = backCount
      this.yaoResults = copy
      return true
    },

    /** 手动排卦：直接设置六次背面数 + 进入结果步骤 */
    setManualAll(backs) {
      if (!Array.isArray(backs) || backs.length !== 6) {
        this.error = '背面数数组必须包含6个值'
        return false
      }
      if (!backs.every(b => b >= 0 && b <= 3)) {
        this.error = '背面数必须在0-3之间'
        return false
      }
      this.yaoResults = [...backs]
      this.currentShakeIndex = 6
      this.currentStep = 'result'
      this.error = null
      return true
    },

    buildPan() {
      if (this.yaoResults.length !== 6) {
        this.error = '摇卦未完成'
        return false
      }
      try {
        this.isLoading = true
        this.guaPan = buildGuaPan(this.yaoResults, this.question, new Date())
        this.currentStep = 'result'
        this.error = null
        return true
      } catch (err) {
        this.error = `排卦失败: ${err.message}`
        console.error('排卦失败:', err)
        return false
      } finally {
        this.isLoading = false
      }
    },

    runAnalysis() {
      if (!this.guaPan) {
        this.error = '卦盘数据不存在'
        return false
      }
      try {
        this.isLoading = true
        const result = analyze(this.guaPan)
        if (result.isFuShen) {
          this.guaPan = resolveFuShen(this.guaPan, result.yongShen)
        }
        this.analysis = result
        this.error = null
        return true
      } catch (err) {
        this.error = `解卦失败: ${err.message}`
        console.error('解卦失败:', err)
        return false
      } finally {
        this.isLoading = false
      }
    },

    async saveCurrent() {
      if (!this.guaPan) {
        this.error = '没有可保存的卦盘'
        return { success: false, error: '没有可保存的卦盘' }
      }
      try {
        this.isLoading = true
        const result = saveRecord(this.guaPan, this.analysis)
        if (result.success) {
          this.error = null
        } else {
          this.error = result.error || '保存失败'
        }
        return result
      } catch (err) {
        this.error = `保存失败: ${err.message}`
        console.error('保存失败:', err)
        return { success: false, error: err.message }
      } finally {
        this.isLoading = false
      }
    },

    loadHistory() {
      try {
        this.history = getRecords()
      } catch (err) {
        this.error = `加载历史记录失败: ${err.message}`
        console.error('加载历史记录失败:', err)
      }
    },

    deleteHistory(id) {
      try {
        delRecord(id)
        this.history = getRecords()
      } catch (err) {
        this.error = `删除记录失败: ${err.message}`
        console.error('删除记录失败:', err)
      }
    },

    viewRecord(rec) {
      if (!rec || !rec.guaPan) {
        this.error = '记录数据损坏'
        return false
      }
      this.guaPan = rec.guaPan
      this.analysis = rec.analysis || null
      this.isViewing = true
      this.error = null
      return true
    },

    reset() {
      this.currentStep = 'input'
      this.question = ''
      this.yaoResults = []
      this.currentShakeIndex = 0
      this.guaPan = null
      this.analysis = null
      this.isLoading = false
      this.error = null
      this.isViewing = false
    },
  },
})
