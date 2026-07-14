/**
 * @file 解卦规则引擎（增强版）
 * 用神定位、旺衰判断、生克关系、动爻深度分析、格局、神煞、应期、动态结论生成。
 * 所有函数为纯函数，不修改输入参数。
 */
import {
  DI_ZHI_WUXING, DI_ZHI,
  YONG_SHEN_KEYWORDS,
  TIAN_YI_GUI_REN, TAO_HUA, YI_MA,
  WU_XING_SHENG, WU_XING_KE, WU_XING_MU,
  DI_ZHI_HE, DI_ZHI_CHONG,
} from '@/data/constants';

// ── 内部工具 ──────────────────────────────────────────────

const SHENG_REV = {};
const KE_REV = {};
for (const [k, v] of Object.entries(WU_XING_SHENG)) SHENG_REV[v] = k;
for (const [k, v] of Object.entries(WU_XING_KE)) KE_REV[v] = k;

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const YAO_POS = ['初','二','三','四','五','上'];

// 五行 → 通俗季节
const WX_COMMON = { '木': '春天', '火': '夏天', '金': '秋天', '水': '冬天', '土': '换季前后' };

// 地支 → 通俗时间（普通人能理解的自然时间表述）
const DZ_TIME = {
  '子': '深冬（农历十一月前后）', '丑': '年底（农历十二月前后）',
  '寅': '开春（农历正月前后）',   '卯': '春天（农历二月前后）',
  '辰': '春末（农历三月前后）',   '巳': '入夏（农历四月前后）',
  '午': '夏天（农历五月前后）',   '未': '夏末（农历六月前后）',
  '申': '入秋（农历七月前后）',   '酉': '秋天（农历八月前后）',
  '戌': '秋末（农历九月前后）',   '亥': '入冬（农历十月前后）',
};

/** 将应期专业术语转为通俗解释（模式匹配，非字符替换） */
function explainYingQi(text) {
  const patterns = [
    // "待木、水之月日，用神得助"
    [/待(.+?)之月日，用神得助/, (_, wx) => {
      const parts = wx.split('、').map(w => WX_COMMON[w] || w);
      return `大约在${parts.join('或')}时，事情会得到助力`;
    }],
    // "待X日冲开合局"
    [/待(.?)日冲开合局/, (_, dz) => `大约在${DZ_TIME[dz] || dz}，事情会被松开不再被绊住`],
    // "待X日冲出墓库"
    [/待(.?)日冲出墓库/, (_, dz) => `大约在${DZ_TIME[dz] || dz}，力量会从困境中冲出来`],
    // "出空填实之日（X日或Y日）"
    [/出空填实之日（(.+?)日或(.+?)日）/, (_, a, b) =>
      `大约在${DZ_TIME[a] || a}或${DZ_TIME[b] || b}，空缺会被填实`],
    // "待X日冲飞神"
    [/待(.?)日冲飞神/, (_, dz) => `大约在${DZ_TIME[dz] || dz}，当前的阻碍会被清除`],
    // "待X日冲去忌神"
    [/待(.?)日冲去忌神/, (_, dz) => `大约在${DZ_TIME[dz] || dz}，不利因素会被冲散`],
  ];
  for (const [re, fn] of patterns) {
    const m = text.match(re);
    if (m) return fn(...m);
  }
  return text;
}

/** 五行 → 六亲 */
function wxToLiuQin(wx, gongWx) {
  if (!wx || !gongWx) return '';
  if (wx === gongWx) return '兄弟';
  if (WU_XING_SHENG[gongWx] === wx) return '父母';
  if (SHENG_REV[gongWx] === wx) return '子孙';
  if (WU_XING_KE[gongWx] === wx) return '官鬼';
  if (KE_REV[gongWx] === wx) return '妻财';
  return '';
}

/** 六亲 → 五行 */
function liuQinToWx(liuQin, gongWx) {
  const MAP = {
    '父母': WU_XING_SHENG[gongWx], '子孙': SHENG_REV[gongWx],
    '官鬼': WU_XING_KE[gongWx],     '妻财': KE_REV[gongWx],
    '兄弟': gongWx,
  };
  return MAP[liuQin];
}

function isChong(a, b) {
  return DI_ZHI_CHONG.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

function riGanIndex(date) {
  const base = new Date(1900, 0, 1);
  const diff = Math.round((date - base) / 86400000);
  return ((diff % 10) + 10) % 10;
}

function isXunKong(dz, xunKong) {
  return Array.isArray(xunKong) && xunKong.includes(dz);
}

function checkHuaJueMu(fromDz, toDz, wx) {
  if (!fromDz || !toDz || !wx) return '';
  const jueMap = { '金':'寅','木':'申','水':'巳','火':'亥','土':'亥' };
  const muMap = { '金':'丑','木':'未','水':'辰','火':'戌','土':'辰' };
  if (jueMap[wx] === toDz) return '绝';
  if (muMap[wx] === toDz) return '墓';
  return '';
}

// ── 1. 增强用神定位 ────────────────────────────────────

export function locateYongShen(question, guaPan) {
  const typeKeywords = {
    '财运': ['财','钱','投资','生意','收益','赚','经营','股票','基金','理财','分红','涨薪','加薪','借钱','欠款','赔','亏','购物','买','卖','彩票','中奖','砍价'],
    '事业': ['工作','升职','求职','跳槽','事业','官','面试','晋升','辞职','领导','老板','上司','提拔','公务员','编制','转行','竞聘','offer'],
    '感情': ['感情','婚姻','恋爱','对象','女友','男友','桃花','姻缘','分手','复合','相亲','表白','暗恋','暧昧'],
    '健康': ['身体','健康','疾病','病','症','痛','手术','恢复','康复','体检','不适','难受','疼'],
    '出行': ['出行','旅途','旅行','出差','远行','旅游','度假','游玩','出门'],
    '官司': ['官司','诉讼','牢狱','仲裁','纠纷','打官司','被告','原告','判决'],
    '学业': ['学业','学习','读书','考试','成绩','论文','毕业','答辩','录取','升学','考研','考公','考证'],
    '寻物': ['找','丢','丢失','遗失','不见了','去哪了','找不到了','失踪','下落'],
    '迁移': ['搬家','迁移','换城市','去外地','移居','移民','搬迁','换地方'],
    '选择': ['选哪个','怎么选','要不要','该不该','值得吗','去还是','做还是','接受还是','拒绝还是'],
    '人际': ['关系','矛盾','吵架','冲突','得罪','误会','和好','冷战','人缘','社交'],
    '子嗣': ['怀孕','生孩子','生育','胎儿','备孕','宝宝','孩子','子女','小孩'],
    '自身': ['自身','自己','我','运势','运气','状态','近况','发展','未来','整体','综合','怎么样'],
  };

  // 先确定问题类型
  let questionType = '综合';
  for (const [type, kws] of Object.entries(typeKeywords)) {
    if (kws.some(k => question.includes(k))) {
      questionType = type;
      break;
    }
  }

  // 再确定用神六亲
  const { yaoList } = guaPan;

  // 按优先级匹配用神：先精确匹配六亲关键词，再回退世爻
  for (const [liuQin, keywords] of Object.entries(YONG_SHEN_KEYWORDS)) {
    if (!keywords.some(kw => question.includes(kw))) continue;
    if (liuQin === '世爻') {
      const shiYao = yaoList[guaPan.shiYaoIndex];
      if (shiYao && shiYao.naJia) {
        return { yongShen: shiYao.naJia.liuQin, yongShenYao: shiYao, isFuShen: false, questionType };
      }
      return { yongShen: '', yongShenYao: shiYao, isFuShen: false, questionType };
    }
    const match = yaoList.find(y => y.naJia && y.naJia.liuQin === liuQin);
    if (match) return { yongShen: liuQin, yongShenYao: match, isFuShen: false, questionType };
    return { yongShen: liuQin, yongShenYao: null, isFuShen: true, questionType };
  }

  // 完全没有匹配到任何用神关键词 → 默认取世爻六亲
  const shiYao = yaoList[guaPan.shiYaoIndex];
  if (shiYao && shiYao.naJia) {
    return {
      yongShen: shiYao.naJia.liuQin,
      yongShenYao: shiYao,
      isFuShen: false,
      questionType,
      autoDetected: true,
    };
  }
  return { yongShen: '', yongShenYao: null, isFuShen: false, questionType };
}

// ── 2. 旺衰判断（增强空亡、月破、日破） ──────────────

export function analyzeStrength(yongShenYao, lunarMonth, lunarDay, xunKong) {
  if (!yongShenYao || !yongShenYao.naJia) return '平';
  const wx = yongShenYao.naJia.wuXing;
  const dz = yongShenYao.naJia.diZhi;
  const mWx = DI_ZHI_WUXING[lunarMonth];
  const dWx = DI_ZHI_WUXING[lunarDay];

  let score = 0;
  if (mWx === wx) score += 2;
  else if (mWx && WU_XING_SHENG[mWx] === wx) score++;
  else if (mWx && (WU_XING_KE[mWx] === wx || isChong(lunarMonth, dz))) score -= 2;

  if (dWx === wx) score++;
  else if (dWx && WU_XING_SHENG[dWx] === wx) score++;
  else if (dWx && (WU_XING_KE[dWx] === wx || isChong(lunarDay, dz))) score--;

  if (isXunKong(dz, xunKong)) score -= 2;
  if (isChong(lunarMonth, dz)) score -= 3;
  if (isChong(lunarDay, dz)) score -= 1;

  if (score >= 2) return '旺';
  if (score <= -2) return '衰';
  return '平';
}

// ── 3. 用神与世应关系 ──────────────────────────────────

export function analyzeShiRelation(yongShenYao, shiYao) {
  if (!yongShenYao?.naJia || !shiYao?.naJia) return '';
  const yWx = yongShenYao.naJia.wuXing;
  const sWx = shiYao.naJia.wuXing;
  if (yWx === sWx) return '比和';
  if (WU_XING_SHENG[sWx] === yWx) return '世生用神';
  if (WU_XING_SHENG[yWx] === sWx) return '用神生世';
  if (WU_XING_KE[sWx] === yWx) return '世克用神';
  if (WU_XING_KE[yWx] === sWx) return '用神克世';
  return '';
}

// ── 4. 原神／忌神／仇神 ─────────────────────────────────

export function findYuanJiChouShen(guaPan, yongShen) {
  const gongWx = guaPan.gongWuxing;
  const yWx = liuQinToWx(yongShen, gongWx);
  if (!yWx) return { yuanShen: '', jiShen: '', chouShen: '' };
  const yuanWx = WU_XING_SHENG[yWx];
  const jiWx = WU_XING_KE[yWx];
  const chouWx = WU_XING_SHENG[jiWx];
  return {
    yuanShen: wxToLiuQin(yuanWx, gongWx),
    jiShen: wxToLiuQin(jiWx, gongWx),
    chouShen: wxToLiuQin(chouWx, gongWx),
  };
}

// ── 5. 进退神 ──────────────────────────────────────────

export function detectJinTui(dongYao, bianYao) {
  if (!dongYao?.naJia || !bianYao?.naJia) return null;
  if (dongYao.naJia.wuXing !== bianYao.naJia.wuXing) return null;
  const fromIdx = DI_ZHI.indexOf(dongYao.naJia.diZhi);
  const toIdx = DI_ZHI.indexOf(bianYao.naJia.diZhi);
  if (fromIdx === -1 || toIdx === -1) return null;
  const diff = (toIdx - fromIdx + 12) % 12;
  if (diff === 1) return '进神';
  if (diff === 11) return '退神';
  return null;
}

// ── 6. 单爻反吟伏吟 ────────────────────────────────────

export function detectFanYinFuYin(dongYao, bianYao) {
  if (!dongYao?.naJia || !bianYao?.naJia) return null;
  const dz = dongYao.naJia.diZhi;
  const bz = bianYao.naJia.diZhi;
  if (dz === bz) return '伏吟';
  if (isChong(dz, bz)) return '反吟';
  return null;
}

// ── 7. 全盘格局检测 ────────────────────────────────────

export function checkAllPatterns(guaPan) {
  const patterns = [];
  const { yaoList, dongYaoIndexes, guaType } = guaPan;

  const shiYao = yaoList.find(y => y.naJia?.shiYing === '世');
  const yingYao = yaoList.find(y => y.naJia?.shiYing === '应');
  if (shiYao?.naJia && yingYao?.naJia) {
    const sDz = shiYao.naJia.diZhi;
    const yDz = yingYao.naJia.diZhi;
    if (DI_ZHI_HE.some(([a,b]) => (sDz===a && yDz===b) || (sDz===b && yDz===a))) {
      patterns.push('六合');
    }
    if (isChong(sDz, yDz)) patterns.push('六冲');
  }

  const dongYaos = dongYaoIndexes.map(i => yaoList[i]).filter(Boolean);
  if (dongYaos.length >= 3) {
    const dzs = dongYaos.map(y => y.naJia?.diZhi).filter(Boolean);
    const triples = [
      ['申','子','辰'], ['亥','卯','未'], ['寅','午','戌'], ['巳','酉','丑']
    ];
    for (const tri of triples) {
      if (tri.every(dz => dzs.includes(dz))) {
        patterns.push('三合局');
        break;
      }
    }
  }

  if (dongYaoIndexes.length > 0) {
    const allDz = yaoList.map(y => y.naJia?.diZhi).filter(Boolean);
    const allBianDz = yaoList.map(y => y.changedDiZhi || y.naJia?.diZhi).filter(Boolean);
    if (allDz.length === 6 && allBianDz.length === 6) {
      if (allDz.every((dz, i) => dz === allBianDz[i])) patterns.push('伏吟');
      if (allDz.every((dz, i) => isChong(dz, allBianDz[i]))) patterns.push('反吟');
    }
  }

  if (guaType === '游魂') patterns.push('游魂');
  if (guaType === '归魂') patterns.push('归魂');

  return patterns;
}

// ── 8. 神煞标注 ───────────────────────────────────────

export function collectShenSha(guaPan) {
  const { yaoList, lunarDay, startTime } = guaPan;
  const riGan = TIAN_GAN[riGanIndex(startTime)];
  const guiRen = (TIAN_YI_GUI_REN[riGan] || '').split('').filter(Boolean);
  const taoHua = TAO_HUA[lunarDay] || '';
  const yiMa = YI_MA[lunarDay] || '';

  const results = [];
  for (const yao of yaoList) {
    if (!yao.naJia) continue;
    const dz = yao.naJia.diZhi;
    const names = [];
    if (guiRen.includes(dz)) names.push('贵人');
    if (dz === taoHua) names.push('桃花');
    if (dz === yiMa) names.push('驿马');
    yao.shenSha = names;
    if (names.length) results.push({ index: yao.index, names });
  }
  return results;
}

// ── 9. 应期推算 ──────────────────────────────────────

export function calculateYingQi(guaPan, analysis) {
  const candidates = [];
  const { yongShenYao, isFuShen, strength, dongYaoDetails } = analysis;
  if (!yongShenYao?.naJia) return candidates;
  const wx = yongShenYao.naJia.wuXing;
  const dz = yongShenYao.naJia.diZhi;

  if (strength === '衰') {
    const shengWx = WU_XING_SHENG[wx];
    const tongWx = wx;
    candidates.push(`待${tongWx}、${shengWx}之月日，用神得助`);
  }

  const hePair = DI_ZHI_HE.find(([a, b]) => dz === a || dz === b);
  if (hePair) {
    const other = dz === hePair[0] ? hePair[1] : hePair[0];
    const chong = DI_ZHI_CHONG.find(([a, b]) => other === a || other === b);
    if (chong) {
      candidates.push(`待${chong[0] === other ? chong[1] : chong[0]}日冲开合局`);
    }
  }

  const mu = WU_XING_MU[wx];
  if (mu === dz) {
    const chong = DI_ZHI_CHONG.find(([a, b]) => mu === a || mu === b);
    if (chong) candidates.push(`待${chong[0] === mu ? chong[1] : chong[0]}日冲出墓库`);
  }

  if (guaPan.xunKong && isXunKong(dz, guaPan.xunKong)) {
    candidates.push(`出空填实之日（${guaPan.xunKong[0]}日或${guaPan.xunKong[1]}日）`);
  }

  if (isFuShen && guaPan.fuShen) {
    const feiDz = guaPan.fuShen.feiDiZhi;
    const chong = DI_ZHI_CHONG.find(([a, b]) => feiDz === a || feiDz === b);
    if (chong) {
      candidates.push(`待${feiDz === chong[0] ? chong[1] : chong[0]}日冲飞神`);
    }
  }

  if (dongYaoDetails) {
    for (const d of dongYaoDetails) {
      if (d.liuQin === analysis.jiShen && d.relationToYong?.includes('忌神')) {
        const jiDz = d.diZhi;
        const chongJi = DI_ZHI_CHONG.find(([a, b]) => jiDz === a || jiDz === b);
        if (chongJi) {
          candidates.push(`待${jiDz === chongJi[0] ? chongJi[1] : chongJi[0]}日冲去忌神`);
        }
      }
    }
  }

  return candidates;
}

// ── 10. 动爻深度分析 ─────────────────────────────────

export function analyzeDongYao(guaPan, yongShenYao, yjc) {
  const dongYaoDetails = [];
  const dongYaoEffects = [];
  for (const idx of guaPan.dongYaoIndexes) {
    const dongYao = guaPan.yaoList[idx];
    if (!dongYao?.naJia) continue;
    const bianYao = { ...dongYao, yinYang: dongYao.changedYinYang || dongYao.yinYang };
    const jt = detectJinTui(dongYao, bianYao);
    const fy = detectFanYinFuYin(dongYao, bianYao);
    const huiTouKe = (bianYao.naJia && dongYao.naJia &&
      WU_XING_KE[bianYao.naJia.wuXing] === dongYao.naJia.wuXing);
    const huaJueMu = checkHuaJueMu(dongYao.naJia.diZhi, dongYao.changedDiZhi, dongYao.naJia.wuXing);

    let effectStr = '';
    if (jt) effectStr = `${YAO_POS[idx]}爻${jt}`;
    else if (fy) effectStr = `${YAO_POS[idx]}爻${fy}`;
    else if (huiTouKe) effectStr = `${YAO_POS[idx]}爻动化回头克`;
    else if (huaJueMu) effectStr = `${YAO_POS[idx]}爻动化${huaJueMu}`;
    else effectStr = `${YAO_POS[idx]}爻动`;
    dongYaoEffects.push(effectStr);

    let relationDetail = '';
    if (yongShenYao?.naJia) {
      const dLq = dongYao.naJia.liuQin;
      const yLq = yongShenYao.naJia.liuQin;
      if (dLq === yjc.yuanShen) relationDetail = '原神发动生用神';
      else if (dLq === yjc.jiShen) relationDetail = '忌神发动克用神';
      else if (dLq === yjc.chouShen) relationDetail = '仇神发动（生忌克原）';
      else if (dLq === yLq) relationDetail = '用神自身发动';
      else if (dongYao.naJia && yongShenYao.naJia) {
        if (WU_XING_SHENG[dongYao.naJia.wuXing] === yongShenYao.naJia.wuXing) relationDetail = '动来生用';
        else if (WU_XING_KE[dongYao.naJia.wuXing] === yongShenYao.naJia.wuXing) relationDetail = '动来克用';
      }
    }
    dongYaoDetails.push({
      index: idx,
      pos: YAO_POS[idx],
      liuQin: dongYao.naJia.liuQin,
      diZhi: dongYao.naJia.diZhi,
      effect: effectStr,
      jinTui: jt,
      fanFu: fy,
      huiTouKe,
      huaJueMu,
      relationToYong: relationDetail,
    });
  }
  return { dongYaoDetails, dongYaoEffects };
}

// ── 11. 动态结论生成 ────────────────────────────────────

export function generateConclusion(guaPan, analysis) {
  const {
    yongShen, yongShenYao, isFuShen, strength, relationToShi,
    dongYaoDetails, patterns, shenShaEffects,
    yingQiCandidates, yuanShen, jiShen,
  } = analysis;
  const question = guaPan.question || '';
  const blocks = [];

  // ── 开场 ──
  blocks.push(`您问："${question}"。卦象已显，解曰：`);

  // ── 用神定位 ──
  const ynBlock = buildYongShenBlock(yongShen, yongShenYao, isFuShen, strength, guaPan);
  if (ynBlock) blocks.push(ynBlock);

  // ── 世爻分析 ──
  const shiBlock = buildShiYaoBlock(guaPan, relationToShi);
  if (shiBlock) blocks.push(shiBlock);

  // ── 动爻剖析 ──
  const dongBlock = buildDongYaoBlock(dongYaoDetails);
  if (dongBlock) blocks.push(dongBlock);

  // ── 格局 ──
  const patBlock = buildPatternBlock(patterns);
  if (patBlock) blocks.push(patBlock);

  // ── 神煞 ──
  const ssBlock = buildShenShaBlock(shenShaEffects);
  if (ssBlock) blocks.push(ssBlock);

  // ── 综断 ──
  const summaryBlock = buildSummaryBlock(strength, dongYaoDetails, patterns, shenShaEffects, yuanShen, jiShen);
  if (summaryBlock) blocks.push(summaryBlock);

  // ── 应期 ──
  const yqBlock = buildYingQiBlock(yingQiCandidates);
  if (yqBlock) blocks.push(yqBlock);

  // ── 建议 ──
  const advice = generateAdvice(analysis, guaPan);
  if (advice) blocks.push(`【建议】${advice}`);

  return blocks.join('\n\n');
}

// ── 各段落构建函数 ──

function buildYongShenBlock(yongShen, yongShenYao, isFuShen, strength, guaPan) {
  if (yongShenYao?.naJia) {
    const yaoName = YAO_POS[yongShenYao.index];
    const dz = yongShenYao.naJia.diZhi;
    const wx = yongShenYao.naJia.wuXing;
    const xk = isXunKong(dz, guaPan.xunKong) ? '（落空亡）' : '';
    const lines = [`用神${yongShen}，在${yaoName}爻${dz}${wx}${xk}。`];
    if (strength === '旺') {
      lines.push(`月建${guaPan.lunarMonth}生扶，日辰${guaPan.lunarDay}亦不悖，为旺相之象，说明这件事的核心力量很充足。`);
    } else if (strength === '衰') {
      lines.push(`受月建${guaPan.lunarMonth}克害，日辰${guaPan.lunarDay}无助，休囚无力，说明事情目前缺乏足够的支撑。`);
      if (isXunKong(dz, guaPan.xunKong)) lines.push('又落空亡，更是虚浮不实，需待出空方能有所起色。');
    } else {
      lines.push('不旺不衰，根基平平，吉凶全看周围因素如何配合。');
    }
    return lines.join('');
  }
  if (isFuShen) return `用神${yongShen}伏藏不现，事机暗昧，所求之事目前还隐藏在表面之下，不易看清。`;
  return '卦中未显明确用神，需要综合全盘来推断走势。';
}

function buildShiYaoBlock(guaPan, relationToShi) {
  const shiYao = guaPan.yaoList[guaPan.shiYaoIndex];
  if (!shiYao?.naJia || !relationToShi) return '';
  const explainMap = {
    '比和': '事在人为，您与此事关系密切，成败很大程度取决于您自己的行动。',
    '世生用神': '您为此事付出了不少心血，但也要注意别透支自己——量力而行，细水长流。',
    '用神生世': '这件事对您有利，运气站在您这边，顺势而为比硬闯更有效。',
    '世克用神': '您对这件事有掌控力，但也可能因为太想控制而用力过猛，适当放手反而更好。',
    '用神克世': '这件事会给您带来压力，需要格外小心——不是不能做，而是要多做准备，别打无把握的仗。',
  };
  return `世爻${shiYao.naJia.liuQin}${shiYao.naJia.diZhi}，${relationToShi}。${explainMap[relationToShi] || ''}`;
}

function buildDongYaoBlock(dongYaoDetails) {
  if (!dongYaoDetails.length) return '';
  const lines = [];
  for (const d of dongYaoDetails) {
    let desc = `${d.pos}爻${d.liuQin}${d.effect}`;
    if (d.relationToYong) desc += `，${d.relationToYong}`;
    if (d.jinTui) desc += d.jinTui === '进神' ? '，力量渐增，越往后越有利' : '，力量消退，越往后越弱';
    if (d.fanFu === '反吟') desc += '，反覆无常，计划赶不上变化';
    if (d.fanFu === '伏吟') desc += '，呻吟难进，进展会比较缓慢';
    if (d.huiTouKe) desc += '，变爻回头克，这是先易后难的危险信号';
    if (d.huaJueMu) desc += `，化${d.huaJueMu}，气机将尽，后续乏力`;
    lines.push(desc);
  }
  return `动爻详解：${lines.join('；')}。`;
}

function buildPatternBlock(patterns) {
  if (!patterns.length) return '';
  const pDesc = patterns.map(p => ({
    '六合': '六合主和合顺利，各方面容易协调配合，是吉利的信号',
    '六冲': '六冲主冲动反复，事情容易散掉或中途生变，需多加防范',
    '三合局': '三合局聚气，三股力量汇在一起，能量非常强大',
    '伏吟': '卦逢伏吟，如人呻吟不安，事情进展缓慢甚至停滞',
    '反吟': '卦逢反吟，反复无常，方向来回变，让人无所适从',
    '游魂': '游魂卦，人心思动，外界诱惑多，容易三心二意',
    '归魂': '归魂卦，事有归宿，外面跑不如回守，深耕更有收获',
  })[p] || p).join('；');
  return `卦象格局：${pDesc}。`;
}

function buildShenShaBlock(shenShaEffects) {
  if (!shenShaEffects.length) return '';
  const hasGuiRen = shenShaEffects.some(s => s.includes('贵人'));
  const hasTaoHua = shenShaEffects.some(s => s.includes('桃花'));
  const hasYiMa = shenShaEffects.some(s => s.includes('驿马'));
  const tips = [];
  if (hasGuiRen) tips.push('贵人临爻，关键时刻会有贵人出现拉你一把');
  if (hasTaoHua) tips.push('桃花入卦，感情方面有动向，但也可能是烂桃花，需分辨');
  if (hasYiMa) tips.push('驿马星动，有奔波变动之象，出行或换环境的可能性大');
  return `神煞：${shenShaEffects.join('、')}。${tips.join('；')}。`;
}

function buildSummaryBlock(strength, dongYaoDetails, patterns, shenShaEffects, yuanShen, jiShen) {
  const plainPos = [], plainNeg = [];

  if (strength === '旺') {
    plainPos.push('事情根基不错，力量充足');
  } else if (strength === '衰') {
    plainNeg.push('事情目前的底气不足，缺乏支撑');
  }
  for (const d of dongYaoDetails) {
    if (d.relationToYong?.includes('原神')) {
      plainPos.push('有助力在推动这件事往前');
    }
    if (d.relationToYong?.includes('忌神')) {
      plainNeg.push('有阻力在挡着这件事');
    }
    if (d.huiTouKe) {
      plainNeg.push('开头顺利但后面会遇到回头困难');
    }
    if (d.fanFu === '伏吟') {
      plainNeg.push('事情进展缓慢，陷入胶着');
    }
    if (d.fanFu === '反吟') {
      plainNeg.push('事情反复不定，容易反复');
    }
    if (d.jinTui === '进神') {
      plainPos.push('事情正在向前推进，势头越来越好');
    }
    if (d.jinTui === '退神') {
      plainNeg.push('事情正在往后退，力量在消退');
    }
  }
  if (patterns.includes('六合')) {
    plainPos.push('卦带六合，各方面容易协调配合');
  }
  if (patterns.includes('六冲')) {
    plainNeg.push('卦带六冲，事情容易散掉或反复');
  }
  if (patterns.includes('三合局')) {
    plainPos.push('三合局聚气，多股力量汇聚');
  }
  if (patterns.includes('游魂')) {
    plainNeg.push('游魂卦主变动，人心不定');
  }
  if (patterns.includes('归魂')) {
    plainPos.push('归魂卦主回归，守住现有比开拓新局更有利');
  }
  if (shenShaEffects.some(s => s.includes('贵人'))) {
    plainPos.push('关键时刻会有人拉你一把');
  }
  if (shenShaEffects.some(s => s.includes('驿马'))) {
    plainNeg.push('驿马星动，变动和奔波不可避免');
  }

  if (!plainPos.length && !plainNeg.length) return '';

  if (plainPos.length && plainNeg.length) {
    const hasBoth = dongYaoDetails.some(d => d.liuQin === yuanShen) &&
                    dongYaoDetails.some(d => d.liuQin === jiShen);
    return `综断：${plainPos.join('，')}；但另一方面，${plainNeg.join('，')}。${hasBoth ? '助力与阻力同时出现，开始可能不顺，后面会慢慢好起来。' : '机会和风险并存，哪边力量大，结果就往哪边走。'}`;
  }
  if (plainPos.length) {
    return `综断：${plainPos.join('，')}，这件事成的可能性比较大。`;
  }
  return `综断：${plainNeg.join('，')}。建议暂时稳住，不要硬闯。`;
}

function buildYingQiBlock(yingQiCandidates) {
  if (!yingQiCandidates.length) return '';
  const items = yingQiCandidates.map(yq => {
    const plain = explainYingQi(yq);
    return plain !== yq ? `${plain}（${yq}）` : yq;
  });
  return `应期参考：${items.join('；')}。`;
}

function generateAdvice(analysis, guaPan) {
  const { questionType, strength, dongYaoDetails, patterns, shenShaEffects, yingQiCandidates,
    yongShen, yongShenYao, relationToShi, yuanShen, jiShen, isFuShen } = analysis;
  const advices = [];
  const question = guaPan.question || '';
  const subject = question.length > 15 ? question.slice(0, 15) + '…' : (question || '这件事');
  const hasDongYao = dongYaoDetails.length > 0;
  const hasYuanShenDong = dongYaoDetails.some(d => d.liuQin === yuanShen);
  const hasJiShenDong = dongYaoDetails.some(d => d.liuQin === jiShen);
  const hasHuiTouKe = dongYaoDetails.some(d => d.huiTouKe);
  const hasFuYin = dongYaoDetails.some(d => d.fanFu === '伏吟');
  const hasFanYin = dongYaoDetails.some(d => d.fanFu === '反吟');
  const hasJinShen = dongYaoDetails.some(d => d.jinTui === '进神');
  const hasTuiShen = dongYaoDetails.some(d => d.jinTui === '退神');
  const hasGuiRen = shenShaEffects.some(s => s.includes('贵人'));
  const hasTaoHua = shenShaEffects.some(s => s.includes('桃花'));
  const hasYiMa = shenShaEffects.some(s => s.includes('驿马'));

  // ── 核心建议（按问题类型 + 卦象状态组合）──
  if (questionType === '财运') {
    if (strength === '旺') {
      advices.push(`关于"${subject}"，目前财运势头正旺，是个可以主动出击的好时机。`);
      if (hasYuanShenDong) {
        advices.push('卦中有生财的源头在动，说明财路不止一条——可能有额外的收入来源或者副业机会，留意身边的人给你介绍的机会。');
      }
      if (hasHuiTouKe) {
        advices.push('但要注意，卦中有"开始顺利后来反转"的信号。赚到一定程度就收手，别贪。比如设一个止盈点，到了就撤，剩下的利润让别人去赚。');
      } else if (hasJiShenDong) {
        advices.push('不过有一个风险信号——可能有意外开销或者不靠谱的投资机会冒出来。有人拉你合伙或借钱时，多留个心眼。');
      } else {
        advices.push('适合主动出击，但别把所有资金压在一个项目上。分散风险，把鸡蛋放在两三个篮子里。');
      }
    } else if (strength === '衰') {
      advices.push(`关于"${subject}"，现在真不是赚钱的好时候。财星无力，强行投资或扩张反而容易亏。`);
      if (hasTuiShen) {
        advices.push('而且卦中财气在消退，意味着现在的收入来源可能不太稳定——比如项目回款慢、客户流失之类。提前做个预算留足备用金比较靠谱。');
      }
      advices.push('这个阶段的核心是"守"，不是"攻"。把开销理清楚，不必要的消费先砍掉，手头有余粮心里才不慌。');
    } else {
      advices.push(`关于"${subject}"，财运不温不火——有进有出，存不下大钱。`);
      if (isFuShen) {
        advices.push('财星伏藏不现，说明赚钱的机会还没浮出水面。与其到处找机会，不如把现在能做的事做好——比如把工作技能提上去，收入自然会涨。');
      } else {
        advices.push('别老琢磨怎么一夜暴富，先把小钱管好。记记账，看看钱都花哪了，省下来的就是赚到的。');
      }
    }
  } else if (questionType === '事业') {
    if (strength === '旺') {
      advices.push(`关于"${subject}"，事业上正是春风得意的时候，领导和同事可能都在关注你。`);
      if (hasJinShen) {
        advices.push('而且卦中有"进神"信号，说明你正处于上升通道——接下来几个月很关键，有好机会要敢于争取，别犹豫。主动请缨做重点项目或者在会议上提出你的想法，可能会让你脱颖而出。');
      } else {
        advices.push('有想法就大胆提，有项目就主动请缨。这时候出头不是坏事——你越是积极，越能抓住上升的势头。');
      }
      if (hasGuiRen) advices.push('另外，卦中贵人星出现，可能会有上司或前辈在背后帮你说话。保持好和他们的关系，不用刻意讨好，正常做好工作就行。');
    } else if (strength === '衰') {
      advices.push(`关于"${subject}"，事业上目前处于低谷期，做什么都可能觉得不顺。`);
      if (hasFuYin) {
        advices.push('卦中有停滞信号，说明你可能被困在一个位置上动不了——想走又没合适的机会，想留又不甘心。这种时候硬闯不如蓄力，把业余时间用来学点东西或拿个证书。');
      } else {
        advices.push('别在低潮时做重大决定——比如裸辞、跟领导翻脸。先稳住，把精力放在自我提升上，等机会来了你才有能力接住。');
      }
      if (hasTuiShen) advices.push('卦中还有"退神"，说明你现在的位置可能本身就在萎缩——如果公司整体在下滑，那趁早准备Plan B总是没错的。');
    } else {
      advices.push(`关于"${subject}"，事业运势平稳，不会有什么大起大落。`);
      advices.push('这其实是好事——没有坏消息就是好消息。趁这段平静期把基础打牢：梳理一下手头的工作流程、提升效率、搞好团队关系。这些看似平常的事，环境一变就会显出差距。');
    }
  } else if (questionType === '感情') {
    if (patterns.includes('六冲')) {
      advices.push('六冲卦在感情里是个强烈信号——你们之间可能存在根本性的分歧，或者最近冲突不断。');
      advices.push('越是这种时候，越要管住嘴。气头上说的话收不回来，很多关系就是毁在一时冲动上。如果实在吵得厉害，不如暂时冷静一下，各自待几天，情绪平复了再聊。');
      if (hasTaoHua) advices.push('卦中还有桃花出现——但这不一定是好事。在关系紧张的时候，外面出现的人可能只是看起来美好，别因为一时的新鲜感激动作出让自己后悔的决定。');
    } else if (strength === '旺') {
      advices.push(`关于"${subject}"，感情方面运势正旺——是好事。单身的多出去社交、参加活动，机会就在不经意间。`);
      advices.push('有伴的，这段时间感情会比较甜蜜，适合一起规划未来，比如一起旅行或者讨论一些长远的事。');
      if (hasGuiRen) advices.push('另外贵人星动，可能会有朋友介绍认识新的人——不管是单身的想脱单，还是有伴的想拓展社交圈，都值得期待。');
    } else if (isFuShen) {
      advices.push('卦中用神伏藏，说明你真正想要的那份感情目前还没出现——但这不代表永远没有。');
      advices.push('伏藏的意思是"隐藏在地表之下"。与其急急忙忙开始一段不合适的，不如先把注意力放在自己身上——一个人过得好了，自然而然会吸引到对的人。');
    } else {
      advices.push('感情的事急不来。缘分这种东西，越使劲越容易弄巧成拙。');
      advices.push('先把自己活明白——培养个爱好、把身体锻炼好、把工作做稳。你状态好了，身边的人也会不一样。');
    }
  } else if (questionType === '健康') {
    if (strength === '衰') {
      const wx = yongShenYao?.naJia?.wuXing || '';
      const bodyMap = { '木': '肝胆和筋骨', '火': '心脏和血液循环', '金': '肺和呼吸道', '水': '肾脏和泌尿系统', '土': '脾胃和消化系统' };
      const part = bodyMap[wx] || '身体';
      advices.push(`卦中显示${part}方面需要特别留意。这不是吓你——而是提醒你该注意了。`);
      if (hasFuYin) {
        advices.push('而且卦有停滞信号，说明这个问题可能拖了一段时间了。别再用"忙完这阵就去"当借口了，现在就去医院看看。哪怕只是做个常规检查，心里也有底。');
      } else {
        advices.push('该体检就体检，该休息就休息。身体比工作重要——工作没了可以再找，身体垮了就什么都没了。');
      }
      if (hasJiShenDong) advices.push('卦中还有不利因素在动，要特别注意生活习惯——熬夜、饮食不规律这些老生常谈的事，真的会积少成多。');
    } else {
      advices.push('身体状态总体稳定，没什么大问题。但这不代表可以随便透支——现在的健康是之前积累的，继续作的话迟早会出问题。');
      advices.push('保持规律作息、适量运动、定期体检。这些事虽然老套，但真的管用。');
    }
  } else if (questionType === '出行') {
    if (patterns.includes('游魂')) {
      advices.push('游魂卦主动荡不安——你可能正在计划出行或者已经在路上了。行程上容易出现变动，比如航班延误、临时改签之类，提前做好预案。');
    } else if (hasYiMa) {
      advices.push('驿马星动，出行运很强——你近期很可能真的会有一趟远行。出行方面总体顺利，但要留意随身物品，特别是证件、钱包这种小东西。');
    } else {
      advices.push('出行运势平稳，按计划走就行。出门前检查一下证件有没有过期、订票信息有没有搞错——这些小事比卦象更容易出问题。');
    }
  } else if (questionType === '学业') {
    if (strength === '旺') {
      advices.push(`关于"${subject}"，学业运正旺，是读书考试的好时机。专注力会比平时高，要利用好这段时间。`);
      if (hasJinShen) advices.push('而且卦中显示进步的趋势很明显——你现在的努力不会白费，越往后效果越明显。坚持下去，别中途松懈。');
    } else {
      advices.push(`关于"${subject}"，最近学习状态可能不太好，容易走神。别硬逼自己坐在书桌前——换个环境、换个方法试试。比如把大目标拆成每天半小时的小任务，完成一个就奖励自己一下。`);
    }
  } else if (questionType === '寻物') {
    if (strength === '旺') {
      advices.push('你找的这个东西应该还在，没丢远。重点翻翻三个地方：最后一次见到它的那个房间、包里或外套口袋里、还有平时不怎么打开的抽屉或柜子。');
      if (yongShenYao?.naJia) {
        const pos = YAO_POS[yongShenYao.index];
        const dirMap = { '初': '低处或地面', '二': '腰部高度', '三': '桌面或中层', '四': '高处或上层', '五': '高处或柜顶', '上': '最顶部或阁楼' };
        advices.push(`卦象提示在${pos}爻位置——也就是说可能在${dirMap[pos] || '中等高度'}的地方。`);
      }
    } else if (strength === '衰') {
      advices.push('这个东西可能已经不在你身边了。想想最近有没有带出去过——比如饭店、车里、朋友家。赶紧发个朋友圈问问或者回去找找，越早越好。');
    } else {
      advices.push('东西应该没丢远，但可能在你完全没想到的地方。比如夹在书里、掉到沙发缝里、塞在某个包里忘了。别急，静下来仔细回忆最后一次用到它的场景。');
    }
  } else if (questionType === '迁移') {
    if (strength === '旺') {
      advices.push('关于换地方这件事，卦象显示时机是合适的。不过搬家或换城市是大事，建议你先去目标城市实地感受一下——住两天、转转大街小巷，看看是不是真的喜欢。');
      if (hasYiMa) advices.push('驿马星动叠加旺相，说明近期确实会有变动发生。主动规划比被动应付好得多。');
    } else if (patterns.includes('归魂')) {
      advices.push('归魂卦的意思是"回来吧"。如果你想搬走，卦象在提醒你：你现在的根基在这里，搬走不一定就更好。先想清楚是真的需要换环境，还是只是对现在的生活有点厌倦。');
    } else {
      advices.push('现在不太适合大动。既然卦象没有明确支持，不妨先缓一缓——做好调研、攒足预算、等一个更合适的时机再行动。');
    }
  } else if (questionType === '选择') {
    if (patterns.includes('游魂')) {
      advices.push('你心里已经摇摆很久了。卦象说实话——两条路各有利弊，没有哪条是完美的。但如果非要选一个，跟着你的直觉走。人往往在反复权衡的时候，第一反应才是最真实的。');
    } else if (hasFanYin) {
      advices.push('卦中有反复信号，意味着你可能今天想了选A，明天又觉得B好。这种状态本身就在消耗你。建议给自己设个截止时间，比如三天内做决定，然后就执行，别再回头看。');
    } else {
      advices.push('面对选择，建议列一张纸，左边写好处、右边写风险。哪个对半年后、一年后的你更有利？别只盯着眼前，把眼光放长远。');
    }
  } else if (questionType === '人际') {
    if (patterns.includes('六冲')) {
      advices.push('六冲卦在人际关系上是个警示——冲突一旦爆发，伤害会比较深。现在不是硬碰硬的时候，能降火就降火。');
      advices.push('如果你是被动的一方，暂时保持距离反而能保护自己。如果你是主动方，这时候去道歉或示好，对方可能还没准备好接受——再等等。');
    } else if (relationToShi === '用神克世') {
      advices.push('卦象显示你和对方的关系中，你处于被压制的一方。对方可能比你强势——但这不意味着你永远被动。给自己划一条底线，越过了就必须说"不"。');
    } else {
      advices.push('人和人的事，往往不是对错问题，而是角度问题。试着站在对方鞋里想一想——不是让你妥协，而是理解了对方的动机之后，你会更容易找到解决办法。');
    }
  } else if (questionType === '子嗣') {
    if (strength === '旺') {
      advices.push('关于孩子或备孕的事，卦象是积极的信号。如果是在备孕阶段，保持好心态比吃什么补品都重要——焦虑本身就会影响身体状态。');
      if (hasGuiRen) advices.push('贵人星出现，可能有长辈或专业人士能给你关键的建议或帮助，别不好意思开口。');
    } else if (strength === '衰') {
      advices.push('目前时机可能还没到，身体状态或外部条件还需要一些时间准备。不必着急——双方都去检查一下，该调理就调理。');
      if (hasFuYin) advices.push('卦象显示事情暂时卡住了，可能需要比预期更长的时间。这种时候越焦虑越没用，把注意力放在当下的生活上反而更好。');
    } else {
      advices.push('关于孩子的事，不要太执着于结果。把焦点放在提升自己的身体状态和夫妻关系上——好的土壤自然会长出好苗。');
    }
  } else if (questionType === '官司') {
    if (strength === '旺') {
      advices.push('官司或纠纷方面，卦象对你比较有利。但官司这种事，即使赢面大也不要掉以轻心——证据、材料、时间节点都要准备好。');
      if (hasGuiRen) advices.push('可能有懂行的人愿意帮你——比如律师朋友或者有类似经历的人。多问问、多聊聊，经验之谈往往比书本有用。');
    } else {
      advices.push('官司纠纷的事，卦象不太乐观。如果有可能，尽量走和解的路——诉讼耗时耗力，即使最后赢了也可能得不偿失。');
    }
  } else {
    // 综合类 —— 分析问句特征给出更精准的回答
    if (question.includes('能') || question.includes('会') || question.includes('可以') || question.includes('行吗') || question.includes('成吗')) {
      if (strength === '旺') {
        advices.push(`关于"${subject}"，卦象整体偏吉，成的可能性较大。但卦只是告诉你方向——最终能不能成，还得看你怎么行动。`);
        if (hasDongYao) advices.push('卦中有动爻，说明这件事不会一成不变。过程中可能会出现转机，也可能有波折，关键是你怎么应对。');
      } else if (strength === '衰') {
        advices.push(`关于"${subject}"，目前条件还不够成熟，硬推进可能会碰壁。建议把大目标拆成几个小步骤，先把第一步走稳了再说后面的事。`);
      } else {
        advices.push(`关于"${subject}"，卦象没有给出特别明确的答案——这说明结局不是定死的，你的选择和行动会很大程度上影响结果。`);
      }
    } else if (question.includes('什么时候') || question.includes('多久') || question.includes('何时')) {
      if (yingQiCandidates.length > 0) {
        const firstYq = explainYingQi(yingQiCandidates[0]);
        advices.push(`关于时间点，${firstYq}。在那之前该准备的都准备好——别临到头了手忙脚乱。`);
      } else if (hasFuYin) {
        advices.push('卦中有停滞信号，事情可能需要比预期更久的时间。耐心一点，把等待的时间用在准备上，等转机来了你才能第一时间抓住。');
      } else {
        advices.push('具体时间卦象没有明示。但一般来说，节气前后（立春、立夏、立秋、立冬）是运势转换的节点，可以多留意这几个时间窗口。');
      }
    } else if (question.includes('好不好') || question.includes('怎么样') || question.includes('如何')) {
      if (strength === '旺') {
        advices.push('整体来看，这件事的趋势是向好的。但"好"不代表可以不努力——卦象给了你一个顺风的环境，但船还是要你自己划。');
      } else if (strength === '衰') {
        advices.push('目前来看不算理想。但运势是会变的——今天是低谷不代表永远低谷。这个阶段最适合反思和准备，而不是急于求成。');
      } else {
        advices.push('平平淡淡，不好不坏。这种时候最考验耐心——别因为没看到大进展就放弃，很多事是慢慢积累然后突然爆发的。');
      }
    } else if (question.includes('为什么') || question.includes('怎么') || question.includes('怎样')) {
      if (hasHuiTouKe) {
        advices.push('卦中显示这件事有"先易后难"的特性——开始看似顺利，但后面会碰到困难。如果你现在正在困惑中，很可能就是到了那个转折点。回头看看是不是之前的某些做法现在不适用了？');
      } else if (hasFanYin) {
        advices.push('卦有反复之象——事情可能来来回回好几次了。不要把它当成失败，每一次反复其实都在帮你排除错误的路径。');
      } else {
        advices.push('建议退一步看全局。有时候困在一个问题里就是因为靠太近了——把这件事放到更大的时间线上去看，很多"大问题"其实只是"小插曲"。');
      }
    } else {
      if (strength === '旺') {
        advices.push(`关于"${subject}"，整体运势向好。想做什么就大胆去尝试，别总在原地反复琢磨——行动比完美的计划更重要。`);
      } else if (strength === '衰') {
        advices.push(`关于"${subject}"，眼下时机不太对。与其硬上，不如先积累资本——该学的学、该攒的攒、该联系的人去联系。等风口来了你才能飞起来。`);
      } else {
        advices.push(`关于"${subject}"，运势不温不火。小事可以自己决定，大事最好多跟信任的人商量商量——有时候别人一句话就能让你少走很多弯路。`);
      }
    }
  }

  // ── 补充提示（跨类型的通用提醒）──
  if (hasFuYin && questionType !== '人际' && questionType !== '健康') {
    advices.push('另外需要注意，卦里有停滞的信号——事情可能比预期慢。这不是你做错了什么，而是客观条件需要时间酝酿。别着急，该做什么继续做，急也没用。');
  }
  if (hasFanYin && questionType !== '选择' && questionType !== '综合') {
    advices.push('卦象也提醒你——事情可能会有反复。今天看起来是这样，明天可能又变了。做计划时多留一点变通的空间，别定得太死。');
  }
  if (hasHuiTouKe && questionType !== '财运') {
    advices.push('卦里"先易后难"的信号很明显——开头的顺利可能会让你放松警惕。推进到一定程度后要格外小心，别让之前的成果打水漂。');
  }
  if (patterns.includes('游魂') && questionType !== '出行' && questionType !== '迁移') {
    advices.push('此外，卦带游魂——你内心可能并不安定，总在想着"外面是不是更好"。在做出改变之前，先分辨一下：是真的需要变，还是只是一时冲动？');
  }
  if (patterns.includes('归魂') && questionType !== '迁移') {
    advices.push('归魂卦提醒你：与其到处寻找新的突破口，不如把手头的事做透。深耕现有资源，回报往往比开拓新领域更稳妥。');
  }
  if (hasYiMa && questionType !== '出行') {
    advices.push('驿马星在动，你近期可能会有奔波、出差或搬迁的情况。如果有计划出门，提前准备工作做好；如果没有计划，可能会有突如其来的出行。');
  }

  // ── 时间提示 ──
  if (yingQiCandidates.length > 0) {
    const firstYq = explainYingQi(yingQiCandidates[0]);
    if (firstYq !== yingQiCandidates[0]) {
      advices.push(`从时间上看，${firstYq}。在那之前先把手头能做的事做好，别干等。`);
    }
  }

  if (advices.length === 0) {
    advices.push('整体来看，事情顺其自然就好。尽人事，听天命，别给自己太大压力。');
  }

  return advices.join(' ');
}

// ── 12. 主分析函数 ────────────────────────────────────

export function analyze(guaPan) {
  const loc = locateYongShen(guaPan.question || '', guaPan);
  const { yongShen, yongShenYao, isFuShen, questionType } = loc;
  const strength = analyzeStrength(yongShenYao, guaPan.lunarMonth, guaPan.lunarDay, guaPan.xunKong);
  const shiYao = guaPan.yaoList[guaPan.shiYaoIndex];
  const relationToShi = analyzeShiRelation(yongShenYao, shiYao);
  const yjc = findYuanJiChouShen(guaPan, yongShen);
  const { dongYaoDetails, dongYaoEffects } = analyzeDongYao(guaPan, yongShenYao, yjc);
  const patterns = checkAllPatterns(guaPan);
  const shenShaResults = collectShenSha(guaPan);
  const shenShaEffects = shenShaResults.map(r => `${YAO_POS[r.index]}爻${r.names.join('')}`);

  const analysisObj = {
    yongShen, yongShenYao, isFuShen, questionType,
    relationToShi, strength,
    ...yjc,
    dongYaoDetails, dongYaoEffects,
    patterns, shenShaEffects,
    yingQiCandidates: [],
    conclusion: '',
  };
  analysisObj.yingQiCandidates = calculateYingQi(guaPan, analysisObj);
  analysisObj.conclusion = generateConclusion(guaPan, analysisObj);
  return analysisObj;
}
