import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const store = {};

// 针对用户改写的 storage.js 模块级 isLocalStorageAvailable()，需要在模块加载前就准备好 mock
vi.stubGlobal('localStorage', {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = value; },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
});

// 动态导入确保 mock 先生效
const storageModule = await import('@/utils/storage');
const { saveRecord, getRecords, getRecordById, deleteRecord, clearAll, getRecordCount } = storageModule;

const mockGuaPan = { question: '测试', benGuaName: '乾为天', yaoList: [] };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-14T12:00:00Z'));
  Object.keys(store).forEach(k => delete store[k]);
});
afterEach(() => { vi.useRealTimers(); });

describe('saveRecord & getRecords', () => {
  it('保存后能读取', () => {
    saveRecord(mockGuaPan);
    expect(getRecords()).toHaveLength(1);
  });
  it('按时间倒序', () => {
    vi.setSystemTime(new Date('2026-07-14T00:00:00Z'));
    saveRecord(mockGuaPan);
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'));
    saveRecord({ ...mockGuaPan, question: '测试2' });
    expect(getRecords()[0].guaPan.question).toBe('测试2');
  });
});

describe('getRecordById', () => {
  it('找到正确记录', () => {
    const result = saveRecord(mockGuaPan);
    expect(result.success).toBe(true);
    expect(getRecordById(result.record.id).guaPan.question).toBe('测试');
  });
  it('找不到返回 null', () => {
    expect(getRecordById(99999)).toBeNull();
  });
});

describe('deleteRecord', () => {
  it('删除成功', () => {
    const result = saveRecord(mockGuaPan);
    deleteRecord(result.record.id);
    expect(getRecords()).toHaveLength(0);
  });
});

describe('clearAll', () => {
  it('清空全部', () => {
    saveRecord(mockGuaPan);
    clearAll();
    expect(getRecords()).toHaveLength(0);
  });
});

describe('异常处理', () => {
  it('无效 guaPan 返回失败', () => {
    const r = saveRecord({});
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });
});
