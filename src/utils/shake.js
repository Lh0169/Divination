/**
 * 摇卦逻辑
 * 模拟三枚铜钱摇卦，生成六爻结果及二进制卦象
 */

/**
 * 模拟一次摇卦（三枚铜钱）
 * 每枚铜钱正面概率 0.5，统计背面数
 * @returns {number} 背面数 0~3
 */
export function shakeOnce() {
  let backCount = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.random() < 0.5) backCount++;
  }
  return backCount;
}

/**
 * 根据背面数构建爻对象
 * 0背 → 老阴(变爻 --), 1背 → 少阳(不变 —), 2背 → 少阴(不变 --), 3背 → 老阳(变爻 —)
 * @param {number} backCount 背面数 0~3
 * @returns {{ yinYang: string, isChanged: boolean, changedYinYang: string|null }}
 */
export function buildYao(backCount) {
  const MAP = {
    0: { yinYang: '--', isChanged: true,  changedYinYang: '—' },
    1: { yinYang: '—',  isChanged: false, changedYinYang: null },
    2: { yinYang: '--', isChanged: false, changedYinYang: null },
    3: { yinYang: '—',  isChanged: true,  changedYinYang: '--' },
  };
  return MAP[backCount];
}

/**
 * 生成六次摇卦结果
 * 从初爻到上爻依次摇动，构建本卦/变卦二进制串
 * @returns {{ results: number[], benBinary: string, bianBinary: string, dongIndexes: number[] }}
 */
export function buildSixYao() {
  const results = [];
  for (let i = 0; i < 6; i++) results.push(shakeOnce());

  let benBinary = '';
  let bianBinary = '';
  const dongIndexes = [];

  for (let i = 5; i >= 0; i--) {
    const backs = results[i];
    let yinYang, isDong, changed;
    if (backs === 0)      { yinYang = '0'; isDong = true;  changed = '1'; }
    else if (backs === 1) { yinYang = '1'; isDong = false; changed = '1'; }
    else if (backs === 2) { yinYang = '0'; isDong = false; changed = '0'; }
    else                  { yinYang = '1'; isDong = true;  changed = '0'; }
    benBinary += yinYang;
    bianBinary += (isDong ? changed : yinYang);
    if (isDong) dongIndexes.unshift(i);
  }

  return { results, benBinary, bianBinary, dongIndexes };
}

/**
 * 根据背面数数组构建完整爻列表
 * @param {number[]} results 六次背面数数组（初爻→上爻）
 * @returns {Array<{ index: number, yinYang: string, isChanged: boolean, changedYinYang: string|null, naJia: null }>}
 */
export function buildYaoList(results) {
  return results.map((backs, i) => ({
    index: i,
    ...buildYao(backs),
    naJia: null,
  }));
}
