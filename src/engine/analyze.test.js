import { describe, it, expect } from 'vitest';
import {
  locateYongShen, analyzeStrength, analyzeShiRelation,
  findYuanJiChouShen, detectJinTui, detectFanYinFuYin,
} from '@/engine/analyze';

const pan = {
  gongWuxing: '金', shiYaoIndex: 5,
  yaoList: [
    { index: 0, naJia: { liuQin: '子孙', wuXing: '水', diZhi: '子' } },
    { index: 1, naJia: { liuQin: '妻财', wuXing: '木', diZhi: '寅' } },
    { index: 2, naJia: { liuQin: '父母', wuXing: '土', diZhi: '辰' } },
    { index: 3, naJia: { liuQin: '官鬼', wuXing: '火', diZhi: '午' } },
    { index: 4, naJia: { liuQin: '兄弟', wuXing: '金', diZhi: '申' } },
    { index: 5, naJia: { liuQin: '父母', wuXing: '土', diZhi: '戌' } },
  ],
};

describe('locateYongShen', () => {
  it('财运→妻财', () => {
    const r = locateYongShen('测财运如何', pan);
    expect(r.yongShen).toBe('妻财');
    expect(r.yongShenYao).not.toBeNull();
    expect(r.isFuShen).toBe(false);
  });
  it('工作→官鬼', () => expect(locateYongShen('工作发展', pan).yongShen).toBe('官鬼'));
  it('无匹配→自动取世爻六亲', () => expect(locateYongShen('今天天气', pan).yongShen).toBe('父母'));
  it('自身→世爻位六亲', () => expect(locateYongShen('自身健康', pan).yongShen).toBe('父母'));
});

describe('analyzeStrength', () => {
  const yao = { naJia: { wuXing: '木', diZhi: '寅' } };
  it('同五行→旺', () => expect(analyzeStrength(yao, '寅', '卯', null)).toBe('旺'));
  it('相克→衰', () => expect(analyzeStrength(yao, '申', '酉', null)).toBe('衰'));
  it('null→平', () => expect(analyzeStrength(null, '寅', '卯', null)).toBe('平'));
});

describe('analyzeShiRelation', () => {
  it('同五行→比和', () => expect(analyzeShiRelation(
    { naJia: { wuXing: '木' } }, { naJia: { wuXing: '木' } },
  )).toBe('比和'));
  it('null→空', () => expect(analyzeShiRelation(null, null)).toBe(''));
});

describe('detectJinTui', () => {
  it('寅→卯进神', () => expect(detectJinTui(
    { naJia: { wuXing: '木', diZhi: '寅' } }, { naJia: { wuXing: '木', diZhi: '卯' } },
  )).toBe('进神'));
  it('酉→申退神', () => expect(detectJinTui(
    { naJia: { wuXing: '金', diZhi: '酉' } }, { naJia: { wuXing: '金', diZhi: '申' } },
  )).toBe('退神'));
  it('子→丑非进退', () => expect(detectJinTui(
    { naJia: { wuXing: '水', diZhi: '子' } }, { naJia: { wuXing: '土', diZhi: '丑' } },
  )).toBeNull());
});

describe('detectFanYinFuYin', () => {
  it('子→午反吟', () => expect(detectFanYinFuYin(
    { naJia: { diZhi: '子' } }, { naJia: { diZhi: '午' } },
  )).toBe('反吟'));
  it('寅→寅伏吟', () => expect(detectFanYinFuYin(
    { naJia: { diZhi: '寅' } }, { naJia: { diZhi: '寅' } },
  )).toBe('伏吟'));
});

describe('findYuanJiChouShen（间接验证五行→六亲）', () => {
  it('木宫妻财→原神子孙/忌神兄弟/仇神父母', () => {
    const r = findYuanJiChouShen({ gongWuxing: '木' }, '妻财');
    expect(r.yuanShen).toBe('子孙');
    expect(r.jiShen).toBe('兄弟');
    expect(r.chouShen).toBe('父母');
  });
});
