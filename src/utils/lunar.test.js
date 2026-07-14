import { describe, it, expect } from 'vitest';
import { getRiGanZhi, getYueJian, getTimeInfo, getXunKong } from '@/utils/lunar';

describe('getRiGanZhi', () => {
  it('1900-01-01 返回甲戌日', () => {
    const r = getRiGanZhi(new Date(1900, 0, 1));
    expect(r.gan).toBe('甲');
    expect(r.zhi).toBe('戌');
  });
  it('2000-01-01 返回戊午日', () => {
    const r = getRiGanZhi(new Date(2000, 0, 1));
    expect(r).toEqual({ gan: '戊', zhi: '午' });
  });
  it('2024-02-10 返回甲辰日', () => {
    const r = getRiGanZhi(new Date(2024, 1, 10));
    expect(r).toEqual({ gan: '甲', zhi: '辰' });
  });
});

describe('getXunKong', () => {
  it('甲子 → 戌亥', () => expect(getXunKong('甲子')).toEqual(['戌', '亥']));
  it('甲戌 → 申酉', () => expect(getXunKong('甲戌')).toEqual(['申', '酉']));
  it('甲申 → 午未', () => expect(getXunKong('甲申')).toEqual(['午', '未']));
  it('甲午 → 辰巳', () => expect(getXunKong('甲午')).toEqual(['辰', '巳']));
  it('甲辰 → 寅卯', () => expect(getXunKong('甲辰')).toEqual(['寅', '卯']));
  it('甲寅 → 子丑', () => expect(getXunKong('甲寅')).toEqual(['子', '丑']));
});

describe('getTimeInfo', () => {
  it('返回格式正确', () => {
    const info = getTimeInfo(new Date(2024, 1, 10));
    expect(info).toHaveProperty('yueJian');
    expect(info).toHaveProperty('riChen');
    expect(info).toHaveProperty('riGan');
    expect(info).toHaveProperty('riGanZhi');
    expect(info.riGanZhi.length).toBe(2);
  });
});
