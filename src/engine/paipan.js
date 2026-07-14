/**
 * @file 装卦引擎
 * 六爻起卦后，完成装纳甲、安六亲、定世应、排六神等完整装卦流程。
 * 外部输入 lineResults（摇卦背面数数组），输出完整 GuaPan 卦盘对象。
 */
import {
  BAGUA_CODE, BAGONG_GUA_TABLE, NA_TIAN_GAN, NA_DI_ZHI,
  DI_ZHI_WUXING, LIU_SHEN_LIST,
  WU_XING_SHENG, WU_XING_KE,
} from '@/data/constants';
import { getTimeInfo, getXunKong } from '@/utils/lunar';
import { buildYaoList } from '@/utils/shake';

// ── 内部工具 ──────────────────────────────────────────────

/** 应爻 = 世爻 + 3（隔三位相对） */
const yingOf = (shi) => (shi + 3) % 6;

/** 背面数 → 二进制位 */
function backToBit(backs) {
  if (backs === 0) return '0';
  if (backs === 1) return '1';
  if (backs === 2) return '0';
  return '1'; // 3
}

/** 是否为动爻 */
function isDong(backs) {
  return backs === 0 || backs === 3;
}

/** 日干 → 六神起始偏移 */
function getLiuShenStart(riGan) {
  const map = {
    '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2,
    '己': 2, '庚': 3, '辛': 3, '壬': 4, '癸': 4,
  };
  return map[riGan] ?? 0;
}

/**
 * 五行 → 六亲
 * 以宫五行为"我"，爻地支五行为"他"
 */
function getLiuQinRelation(gongWx, yaoWx) {
  if (gongWx === yaoWx) return '兄弟';
  if (WU_XING_SHENG[gongWx] === yaoWx) return '父母';   /* 生我者 */
  if (WU_XING_SHENG[yaoWx] === gongWx) return '子孙';   /* 我生者 */
  if (WU_XING_KE[gongWx] === yaoWx) return '官鬼';     /* 克我者 */
  if (WU_XING_KE[yaoWx] === gongWx) return '妻财';     /* 我克者 */
  return '';
}

/** 伏飞生克关系 */
function getFuFeiRelation(fuWx, feiWx) {
  if (fuWx === feiWx) return '比和';
  if (WU_XING_SHENG[feiWx] === fuWx) return '伏生飞';  /* 伏生飞神 */
  if (WU_XING_SHENG[fuWx] === feiWx) return '飞生伏';  /* 飞神生伏 */
  if (WU_XING_KE[feiWx] === fuWx) return '伏克飞';    /* 伏克飞神 */
  if (WU_XING_KE[fuWx] === feiWx) return '飞克伏';    /* 飞神克伏 */
  return '';
}

// ── 公开 API ──────────────────────────────────────────────

/**
 * 拆分上下卦
 * @param {string} binary6 - 6 位二进制串（上卦前 3 位，下卦后 3 位）
 * @returns {{ upperCode: number, lowerCode: number }} 上卦和下卦代码（1~8）
 */
export function splitTrigrams(binary6) {
  return {
    upperCode: BAGUA_CODE[binary6.slice(0, 3)],
    lowerCode: BAGUA_CODE[binary6.slice(3, 6)],
  };
}

/**
 * 寻宫定世应
 * 遍历 BAGONG_GUA_TABLE 匹配 6 位二进制串，定位所属宫位和世应位置。
 * @param {string} binary6 - 6 位二进制串
 * @returns {{ gongName: string, gongWuxing: string, guaName: string, shiYao: number, yingYao: number }}
 */
export function findGongByBinary(binary6) {
  for (const gong of BAGONG_GUA_TABLE) {
    for (let i = 0; i < gong.list.length; i++) {
      const [bin, name, shi] = gong.list[i];
      if (bin === binary6) {
        // 游魂=第7卦(索引6), 归魂=第8卦(索引7)
        let guaType = '';
        if (i === 6) guaType = '游魂';
        else if (i === 7) guaType = '归魂';
        return {
          gongName: gong.gongName,
          gongWuxing: gong.wuxing,
          guaName: name,
          shiYao: shi,
          yingYao: yingOf(shi),
          guaType,
        };
      }
    }
  }
  return { gongName: '', gongWuxing: '', guaName: '', shiYao: -1, yingYao: -1, guaType: '' };
}

/**
 * 根据背面数生成本卦、变卦二进制串及动爻索引。
 * 从上爻到初爻构建二进制：
 *   背面数 0→阴(0)动, 1→阳(1)不动, 2→阴(0)不动, 3→阳(1)动
 * 变卦：动爻取反。
 * @param {number[]} lineResults - 长度为 6 的背面数数组（初爻→上爻）
 * @returns {{ benBinary: string, bianBinary: string, dongIndexes: number[] }}
 */
export function buildBenBianBinary(lineResults) {
  let benBinary = '';
  let bianBinary = '';
  const dongIndexes = [];

  for (let i = 5; i >= 0; i--) {
    const backs = lineResults[i];
    const bit = backToBit(backs);
    const dong = isDong(backs);
    benBinary += bit;
    bianBinary += dong ? (bit === '0' ? '1' : '0') : bit;
    if (dong) dongIndexes.unshift(i); /* 结果从初爻到上爻排列 */
  }

  return { benBinary, bianBinary, dongIndexes };
}

/**
 * 装纳甲（天干地支）。
 * 内卦（初、二、三）用 inner 数据，外卦（四、五、上）用 outer 数据。
 * @param {import('@/types').Yao[]} yaoArray
 * @param {number} upperCode - 上卦代码
 * @param {number} lowerCode - 下卦代码
 * @returns {import('@/types').Yao[]}
 */
export function installNaJia(yaoArray, upperCode, lowerCode) {
  const innerGan = NA_TIAN_GAN[lowerCode].inner;
  const outerGan = NA_TIAN_GAN[upperCode].outer;
  const innerZhi = NA_DI_ZHI[lowerCode].inner;
  const outerZhi = NA_DI_ZHI[upperCode].outer;

  return yaoArray.map((yao, i) => {
    const isInner = i < 3;
    const diZhi = isInner ? innerZhi[i] : outerZhi[i - 3];
    return {
      ...yao,
      naJia: {
        tianGan: isInner ? innerGan : outerGan,
        diZhi,
        wuXing: DI_ZHI_WUXING[diZhi],
        liuQin: '',
        liuShen: '',
        shiYing: '',
      },
    };
  });
}

/**
 * 装六亲。
 * 以宫五行为"我"，爻地支五行为"他"：
 *   同我=兄弟, 生我=父母, 我生=子孙, 克我=官鬼, 我克=妻财
 * @param {import('@/types').Yao[]} yaoArray
 * @param {string} gongWuxing - 宫五行
 * @returns {import('@/types').Yao[]}
 */
export function installLiuQin(yaoArray, gongWuxing) {
  return yaoArray.map((yao) => ({
    ...yao,
    naJia: { ...yao.naJia, liuQin: getLiuQinRelation(gongWuxing, yao.naJia.wuXing) },
  }));
}

/**
 * 安世应。
 * @param {import('@/types').Yao[]} yaoArray
 * @param {number} shiYao - 世爻位置（0~5）
 * @param {number} yingYao - 应爻位置（0~5）
 * @returns {import('@/types').Yao[]}
 */
export function installShiYing(yaoArray, shiYao, yingYao) {
  return yaoArray.map((yao) => ({
    ...yao,
    naJia: {
      ...yao.naJia,
      shiYing: yao.index === shiYao ? '世' : yao.index === yingYao ? '应' : '',
    },
  }));
}

/**
 * 排六神。
 * 按日干从初爻起排，甲乙青龙、丙丁朱雀、戊己勾陈、庚辛螣蛇、壬癸白虎。
 * @param {import('@/types').Yao[]} yaoArray
 * @param {string} riGan - 日干
 * @returns {import('@/types').Yao[]}
 */
export function installLiuShen(yaoArray, riGan) {
  const start = getLiuShenStart(riGan);
  return yaoArray.map((yao) => ({
    ...yao,
    naJia: { ...yao.naJia, liuShen: LIU_SHEN_LIST[(start + yao.index) % 6] },
  }));
}

/**
 * 获取本宫首卦（八纯卦）的六爻六亲和纳支信息，用于查伏神。
 * @param {string} gongName - 宫名
 * @returns {import('@/types').Yao[]} 首卦六爻列表（含完整纳甲六亲）
 */
export function getPureGuaByGong(gongName) {
  const gong = BAGONG_GUA_TABLE.find(g => g.gongName === gongName);
  if (!gong) return [];

  const pureBinary = gong.list[0][0];
  const { upperCode, lowerCode } = splitTrigrams(pureBinary);

  /* 构建初始爻列表 */
  const yaos = Array.from({ length: 6 }, (_, i) => ({
    index: i,
    yinYang: pureBinary[i] === '1' ? '—' : '--',
    isChanged: false,
    changedYinYang: null,
    naJia: null,
  }));

  const withNaJia = installNaJia(yaos, upperCode, lowerCode);
  return installLiuQin(withNaJia, gong.wuxing);
}

/**
 * 定伏神。
 * 检查本卦（含变卦同位）六亲中是否有用神；若无则从首卦中查找，
 * 构建伏神对象并挂载到卦盘。
 * 优先级：动爻同位 > 离世爻最近 > 初爻优先。
 * @param {import('@/types').GuaPan} guaPan
 * @param {string} yongShen - 用神六亲名称
 * @returns {import('@/types').GuaPan} 挂载了 fuShen 的新卦盘
 */
export function resolveFuShen(guaPan, yongShen) {
  /* 检查本卦是否已有此六亲 */
  const hasYongShen = guaPan.yaoList.some(
    yao => yao.naJia && yao.naJia.liuQin === yongShen,
  );
  if (hasYongShen) {
    return { ...guaPan, fuShen: null };
  }

  /* 从首卦中查找 */
  const pureYaoList = getPureGuaByGong(guaPan.gongName);
  const candidateIndexes = pureYaoList
    .filter(yao => yao.naJia.liuQin === yongShen)
    .map(yao => yao.index);

  if (candidateIndexes.length === 0) {
    return { ...guaPan, fuShen: null };
  }

  /* 优先级选位 */
  let selected = candidateIndexes[0];

  const dongMatch = candidateIndexes.find(
    idx => guaPan.dongYaoIndexes.includes(idx),
  );
  if (dongMatch !== undefined) {
    selected = dongMatch;
  } else {
    const dist = (idx) => Math.abs(idx - guaPan.shiYaoIndex);
    for (const idx of candidateIndexes) {
      if (dist(idx) < dist(selected) || (dist(idx) === dist(selected) && idx < selected)) {
        selected = idx;
      }
    }
  }

  /* 构建伏神对象 */
  const fuYao = pureYaoList[selected];
  const feiYao = guaPan.yaoList[selected];
  const fuShen = {
    yaoIndex: selected,
    fuLiuQin: fuYao.naJia.liuQin,
    fuDiZhi: fuYao.naJia.diZhi,
    fuWuXing: fuYao.naJia.wuXing,
    feiLiuQin: feiYao.naJia.liuQin,
    feiDiZhi: feiYao.naJia.diZhi,
    relation: getFuFeiRelation(fuYao.naJia.wuXing, feiYao.naJia.wuXing),
  };

  return { ...guaPan, fuShen };
}

/**
 * 完整装卦流程。
 * 注：用神暂不定位（在 analyze.js 中处理），yongShen 初始为 null；
 *     伏神也不在此调用，由外部自行调用 resolveFuShen。
 * @param {number[]} lineResults - 六爻背面数数组（初爻→上爻）
 * @param {string} question - 所问之事
 * @param {Date} [date] - 起卦时间
 * @returns {import('@/types').GuaPan}
 */
export function buildGuaPan(lineResults, question, date) {
  /* 1. 生成本卦 / 变卦二进制 */
  const { benBinary, bianBinary, dongIndexes } = buildBenBianBinary(lineResults);

  /* 2. 寻宫定世应 */
  const gongInfo = findGongByBinary(benBinary);

  /* 3. 拆分上下卦 */
  const { upperCode, lowerCode } = splitTrigrams(benBinary);

  /* 4. 构建初始爻列表 */
  let yaoList = buildYaoList(lineResults);

  /* 5. 装纳甲 */
  yaoList = installNaJia(yaoList, upperCode, lowerCode);

  /* 6. 装六亲 */
  yaoList = installLiuQin(yaoList, gongInfo.gongWuxing);

  /* 7. 安世应 */
  yaoList = installShiYing(yaoList, gongInfo.shiYao, gongInfo.yingYao);

  /* 8. 时间信息 */
  const timeInfo = getTimeInfo(date);
  const xunKong = getXunKong(timeInfo.riGanZhi);

  /* 9. 排六神 */
  yaoList = installLiuShen(yaoList, timeInfo.riGan);

  /* 10. 变卦信息 */
  const bianGongInfo = findGongByBinary(bianBinary);
  const bianSplit = splitTrigrams(bianBinary);
  // 计算变卦纳甲以获取 changedDiZhi
  const bianYaoList = installNaJia(
    Array.from({ length: 6 }, (_, i) => ({ index: i, yinYang: bianBinary[i] === '1' ? '—' : '--' })),
    bianSplit.upperCode, bianSplit.lowerCode,
  );

  /* 11. 组装卦盘 */
  return {
    question,
    startTime: date || new Date(),
    lunarMonth: timeInfo.yueJian,
    lunarDay: timeInfo.riChen,
    xunKong,
    benGuaName: gongInfo.guaName,
    bianGuaName: bianGongInfo.guaName,
    dongYaoIndexes: dongIndexes,
    yaoList: yaoList.map(y => y.isChanged && bianYaoList[y.index]?.naJia
      ? { ...y, changedDiZhi: bianYaoList[y.index].naJia.diZhi }
      : y),
    yongShen: null,
    shiYaoIndex: gongInfo.shiYao,
    yingYaoIndex: gongInfo.yingYao,
    gongName: gongInfo.gongName,
    gongWuxing: gongInfo.gongWuxing,
    guaType: gongInfo.guaType,
  };
}
