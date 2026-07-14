/**
 * 装卦引擎单元测试
 */
import { describe, it, expect } from 'vitest';
import {
  splitTrigrams,
  findGongByBinary,
  buildBenBianBinary,
  installNaJia,
  installLiuQin,
  installShiYing,
  installLiuShen,
  getPureGuaByGong,
  resolveFuShen,
  buildGuaPan,
} from './paipan.js';
import { buildYaoList } from '@/utils/shake';

// ── splitTrigrams ───────────────────────────────────────

describe('splitTrigrams', () => {
  it('乾为天：上乾下乾', () => {
    expect(splitTrigrams('111111')).toEqual({ upperCode: 1, lowerCode: 1 });
  });
  it('天风姤：上乾下巽', () => {
    expect(splitTrigrams('111110')).toEqual({ upperCode: 1, lowerCode: 5 });
  });
  it('坤为地：上坤下坤', () => {
    expect(splitTrigrams('000000')).toEqual({ upperCode: 8, lowerCode: 8 });
  });
});

// ── findGongByBinary ────────────────────────────────────

describe('findGongByBinary', () => {
  it('乾为天', () => {
    const result = findGongByBinary('111111');
    expect(result.gongName).toBe('乾');
    expect(result.gongWuxing).toBe('金');
    expect(result.guaName).toBe('乾为天');
    expect(result.shiYao).toBe(5);
    expect(result.yingYao).toBe(2);
  });
  it('泽火革', () => {
    const result = findGongByBinary('011101');
    expect(result.gongName).toBe('坎');
    expect(result.guaName).toBe('泽火革');
    expect(result.shiYao).toBe(3);
    expect(result.yingYao).toBe(0);
  });
  it('无效二进制返回空', () => {
    const result = findGongByBinary('');
    expect(result.gongName).toBe('');
  });
});

// ── buildBenBianBinary ──────────────────────────────────

describe('buildBenBianBinary', () => {
  it('全少阳(1背) → 乾为天 不变', () => {
    const r = buildBenBianBinary([1, 1, 1, 1, 1, 1]);
    expect(r.benBinary).toBe('111111');
    expect(r.bianBinary).toBe('111111');
    expect(r.dongIndexes).toEqual([]);
  });
  it('初爻老阳(3背) → 初爻动', () => {
    const r = buildBenBianBinary([3, 1, 1, 1, 1, 1]);
    // 老阳 → 阳爻(1) → ben 全阳 = 乾为天
    expect(r.benBinary).toBe('111111');
    // 初爻由1变0 → bian = 天风姤
    expect(r.bianBinary).toBe('111110');
    expect(r.dongIndexes).toEqual([0]);
  });
  it('初爻老阴(0背) → 天风姤 初变阳', () => {
    const r = buildBenBianBinary([0, 1, 1, 1, 1, 1]);
    expect(r.benBinary).toBe('111110');
    expect(r.bianBinary).toBe('111111');
    expect(r.dongIndexes).toEqual([0]);
  });
  it('全老阳(3背) → 全变坤', () => {
    const r = buildBenBianBinary([3, 3, 3, 3, 3, 3]);
    expect(r.benBinary).toBe('111111');
    expect(r.bianBinary).toBe('000000');
    expect(r.dongIndexes).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

// ── installNaJia ────────────────────────────────────────

describe('installNaJia', () => {
  it('乾为天：初甲子 → 上壬戌', () => {
    const yaos = buildYaoList([1, 1, 1, 1, 1, 1]);
    const result = installNaJia(yaos, 1, 1);
    expect(result[0].naJia).toEqual({
      tianGan: '甲', diZhi: '子', wuXing: '水',
      liuQin: '', liuShen: '', shiYing: '',
    });
    expect(result[5].naJia).toEqual({
      tianGan: '壬', diZhi: '戌', wuXing: '土',
      liuQin: '', liuShen: '', shiYing: '',
    });
  });
  it('天风姤：下巽上乾', () => {
    const yaos = buildYaoList([3, 1, 1, 1, 1, 1]);
    const result = installNaJia(yaos, 1, 5);
    // 下巽: 辛丑 辛亥 辛酉
    expect(result[0].naJia.diZhi).toBe('丑');
    expect(result[1].naJia.diZhi).toBe('亥');
    expect(result[2].naJia.diZhi).toBe('酉');
    // 上乾: 壬午 壬申 壬戌
    expect(result[3].naJia.diZhi).toBe('午');
    expect(result[4].naJia.diZhi).toBe('申');
    expect(result[5].naJia.diZhi).toBe('戌');
  });
});

// ── installLiuQin ───────────────────────────────────────

describe('installLiuQin', () => {
  it('乾为天(金宫)：子水子孙 → 戌土父母', () => {
    const yaos = buildYaoList([1, 1, 1, 1, 1, 1]);
    const yaos1 = installNaJia(yaos, 1, 1);
    const result = installLiuQin(yaos1, '金');
    expect(result[0].naJia.liuQin).toBe('子孙'); // 子水: 金生水
    expect(result[1].naJia.liuQin).toBe('妻财'); // 寅木: 金克木
    expect(result[2].naJia.liuQin).toBe('父母'); // 辰土: 土生金
    expect(result[3].naJia.liuQin).toBe('官鬼'); // 午火: 火克金
    expect(result[4].naJia.liuQin).toBe('兄弟'); // 申金: 同金
    expect(result[5].naJia.liuQin).toBe('父母'); // 戌土: 土生金
  });
});

// ── installShiYing ──────────────────────────────────────

describe('installShiYing', () => {
  it('纯卦世5应2', () => {
    const yaos = buildYaoList([1, 1, 1, 1, 1, 1]);
    const yaos1 = installNaJia(yaos, 1, 1);
    const result = installShiYing(yaos1, 5, 2);
    expect(result[5].naJia.shiYing).toBe('世');
    expect(result[2].naJia.shiYing).toBe('应');
    expect(result[0].naJia.shiYing).toBe('');
  });
});

// ── installLiuShen ──────────────────────────────────────

describe('installLiuShen', () => {
  it('甲日：青龙起', () => {
    const yaos = buildYaoList([1, 1, 1, 1, 1, 1]);
    const yaos1 = installNaJia(yaos, 1, 1);
    const result = installLiuShen(yaos1, '甲');
    expect(result[0].naJia.liuShen).toBe('青龙');
    expect(result[1].naJia.liuShen).toBe('朱雀');
    expect(result[5].naJia.liuShen).toBe('玄武');
  });
  it('壬日：白虎起', () => {
    const yaos = buildYaoList([1, 1, 1, 1, 1, 1]);
    const yaos1 = installNaJia(yaos, 1, 1);
    const result = installLiuShen(yaos1, '壬');
    expect(result[0].naJia.liuShen).toBe('白虎');
    expect(result[1].naJia.liuShen).toBe('玄武');
  });
});

// ── getPureGuaByGong ────────────────────────────────────

describe('getPureGuaByGong', () => {
  it('乾宫首卦', () => {
    const pure = getPureGuaByGong('乾');
    expect(pure).toHaveLength(6);
    expect(pure[0].naJia.liuQin).toBe('子孙');
    expect(pure[4].naJia.liuQin).toBe('兄弟');
  });
  it('坤宫首卦', () => {
    const pure = getPureGuaByGong('坤');
    expect(pure).toHaveLength(6);
    expect(pure[0].naJia.liuQin).toBe('兄弟');
    expect(pure[4].naJia.liuQin).toBe('妻财');
  });
  it('不存在的宫返回空数组', () => {
    expect(getPureGuaByGong('不存在')).toEqual([]);
  });
});

// ── resolveFuShen ───────────────────────────────────────

describe('resolveFuShen', () => {
  it('本卦已有用神 → 不取伏神', () => {
    const gp = buildGuaPan([1, 1, 1, 1, 1, 1], '测试');
    const result = resolveFuShen(gp, '子孙');
    expect(result.fuShen).toBeNull();
  });
  it('本卦无用神 → 取伏神', () => {
    // [2,1,1,1,1,1]: 初爻少阴(2)→0, 余少阳(1)→1
    // ben='111110' = 天风姤(乾宫)
    // 天风姤六亲: 初丑土父母、二亥水子孙、三酉金兄弟、
    // 四午火官鬼、五申金兄弟、上戌土父母
    // 缺少 妻财
    const gp = buildGuaPan([2, 1, 1, 1, 1, 1], '测试');
    expect(gp.benGuaName).toBe('天风姤');
    const hasCai = gp.yaoList.some(y => y.naJia.liuQin === '妻财');
    expect(hasCai).toBe(false);
    const result = resolveFuShen(gp, '妻财');
    expect(result.fuShen).not.toBeNull();
    expect(result.fuShen.fuLiuQin).toBe('妻财');
    expect(typeof result.fuShen.relation).toBe('string');
  });
});

// ── buildGuaPan 完整流程 ─────────────────────────────---

describe('buildGuaPan', () => {
  it('乾为天完整卦盘', () => {
    const gp = buildGuaPan([1, 1, 1, 1, 1, 1], '测试');
    expect(gp.benGuaName).toBe('乾为天');
    expect(gp.bianGuaName).toBe('乾为天');
    expect(gp.gongName).toBe('乾');
    expect(gp.gongWuxing).toBe('金');
    expect(gp.shiYaoIndex).toBe(5);
    expect(gp.yingYaoIndex).toBe(2);
    expect(gp.dongYaoIndexes).toEqual([]);
    expect(gp.yaoList).toHaveLength(6);
    expect(gp.xunKong).toHaveLength(2);
    expect(gp.yongShen).toBeNull();
    expect(gp.question).toBe('测试');
    expect(gp.startTime).toBeInstanceOf(Date);
    expect(typeof gp.lunarMonth).toBe('string');
    expect(typeof gp.lunarDay).toBe('string');
  });

  it('乾为天初爻老阳 → 变天风姤', () => {
    const gp = buildGuaPan([3, 1, 1, 1, 1, 1], '测财运');
    // [3,1,1,1,1,1]: 初爻老阳(阳变) → ben全阳=乾为天
    expect(gp.benGuaName).toBe('乾为天');
    // 初爻变阴 → bian=天风姤
    expect(gp.bianGuaName).toBe('天风姤');
    expect(gp.dongYaoIndexes).toEqual([0]);
    expect(gp.yaoList[0].isChanged).toBe(true);
  });

  it('全静爻', () => {
    const gp = buildGuaPan([1, 2, 1, 2, 1, 2], '测事业');
    expect(gp.dongYaoIndexes).toEqual([]);
    expect(gp.yaoList.every(y => !y.isChanged)).toBe(true);
  });
});
