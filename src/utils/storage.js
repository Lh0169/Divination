const STORAGE_KEY = 'gua_records'
const MAX_RECORDS = 100

/**
 * 检查 localStorage 是否可用
 */
function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

const storageAvailable = isLocalStorageAvailable()

function readRecords() {
  if (!storageAvailable) {
    console.warn('localStorage 不可用，使用内存存储')
    return []
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const records = JSON.parse(raw)
    return Array.isArray(records) ? records : []
  } catch (error) {
    console.error('读取卦例记录失败:', error)
    return []
  }
}

function writeRecords(records) {
  if (!storageAvailable) {
    console.warn('localStorage 不可用，无法持久化存储')
    return false
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch (error) {
    console.error('写入卦例记录失败:', error)
    // 存储空间不足时，尝试清理旧记录
    if (error.name === 'QuotaExceededError') {
      console.warn('存储空间不足，尝试清理旧记录')
      const cleaned = records.slice(0, Math.floor(records.length / 2))
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

function validateGuaPan(guaPan) {
  if (!guaPan || typeof guaPan !== 'object') {
    throw new Error('guaPan 必须是对象')
  }
  const required = ['question', 'benGuaName', 'yaoList']
  for (const field of required) {
    if (!guaPan[field]) {
      throw new Error(`guaPan 缺少必填字段: ${field}`)
    }
  }
  // XSS 防护：验证字符串字段
  if (typeof guaPan.question !== 'string') {
    throw new Error('question 必须是字符串')
  }
  if (guaPan.question.length > 200) {
    throw new Error('问题长度不能超过200字')
  }
}

export function saveRecord(guaPan, analysis = null) {
  try {
    validateGuaPan(guaPan)
    const records = readRecords()
    const record = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      guaPan,
      analysis,
    }
    records.push(record)

    // 限制最大记录数
    if (records.length > MAX_RECORDS) {
      records.splice(0, records.length - MAX_RECORDS)
      console.info(`卦例存储已达上限 ${MAX_RECORDS} 条，已清理旧记录`)
    }

    const success = writeRecords(records)
    if (!success) {
      throw new Error('保存失败，请检查存储空间')
    }
    return { success: true, record }
  } catch (error) {
    console.error('保存卦例失败:', error)
    return { success: false, error: error.message }
  }
}

export function getRecords() {
  const records = readRecords()
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getRecordById(id) {
  const records = readRecords()
  return records.find((r) => r.id === id) ?? null
}

export function deleteRecord(id) {
  const records = readRecords()
  writeRecords(records.filter((r) => r.id !== id))
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getRecordCount() {
  return readRecords().length
}
