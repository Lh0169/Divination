import { describe, it, expect } from 'vitest';
import { shakeOnce, buildYao, buildSixYao, buildYaoList } from '@/utils/shake';

describe('shakeOnce', () => {
  it('返回值在 0~3', () => {
    for (let i = 0; i < 100; i++) {
      const r = shakeOnce();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(3);
    }
  });
});

describe('buildYao', () => {
  it('0背=老阴变', () => expect(buildYao(0)).toEqual({ yinYang: '--', isChanged: true, changedYinYang: '—' }));
  it('1背=少阳', () => expect(buildYao(1)).toEqual({ yinYang: '—', isChanged: false, changedYinYang: null }));
  it('2背=少阴', () => expect(buildYao(2)).toEqual({ yinYang: '--', isChanged: false, changedYinYang: null }));
  it('3背=老阳变', () => expect(buildYao(3)).toEqual({ yinYang: '—', isChanged: true, changedYinYang: '--' }));
});

describe('buildSixYao', () => {
  it('返回结构正确', () => {
    const r = buildSixYao();
    expect(r.results).toHaveLength(6);
    expect(r.benBinary).toHaveLength(6);
    expect(r.bianBinary).toHaveLength(6);
    expect(r.results.every(v => v >= 0 && v <= 3)).toBe(true);
  });
});

describe('buildYaoList', () => {
  it('返回6个爻', () => {
    const results = [0, 1, 2, 3, 1, 2];
    const list = buildYaoList(results);
    expect(list).toHaveLength(6);
    expect(list[0].index).toBe(0);
    expect(list[5].index).toBe(5);
    expect(list[0].naJia).toBeNull();
  });
});
