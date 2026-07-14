/** @file 项目手册第8章类型定义的 JSDoc 版本，仅类型无运行时。 */

/**
 * @typedef {object} TimeInfo
 * @property {string} yueJian  - 月建
 * @property {string} riChen   - 日辰
 * @property {string} riGan    - 日干
 * @property {string} riGanZhi - 日干支
 */

/**
 * @typedef {object} GongInfo
 * @property {string} gongName    - 宫名
 * @property {string} gongWuxing  - 宫五行
 * @property {string} guaName     - 卦名
 * @property {number} shiYao      - 世爻位置（0~5）
 * @property {number} yingYao     - 应爻位置（0~5）
 */

/**
 * @typedef {object} ShakeResult
 * @property {number[]} results     - 摇卦结果数组
 * @property {string}   benBinary   - 本卦二进制字符串
 * @property {string}   bianBinary  - 变卦二进制字符串
 * @property {number[]} dongIndexes - 动爻索引数组
 */

/**
 * @typedef {object} NaJia
 * @property {string} tianGan - 纳甲天干
 * @property {string} diZhi   - 纳甲地支
 * @property {string} wuXing  - 五行
 * @property {string} liuQin  - 六亲
 * @property {string} liuShen - 六神
 * @property {'世' | '应' | ''} shiYing - 世应标记
 */

/**
 * @typedef {object} FuShen
 * @property {number} yaoIndex  - 伏神所附飞神爻位
 * @property {string} fuLiuQin  - 伏神六亲
 * @property {string} fuDiZhi   - 伏神地支
 * @property {string} fuWuXing  - 伏神五行
 * @property {string} feiLiuQin - 飞神六亲
 * @property {string} feiDiZhi  - 飞神地支
 * @property {string} relation  - 伏神与飞神关系描述
 */

/**
 * @typedef {object} Yao
 * @property {number}        index            - 爻位（0=初爻，5=上爻）
 * @property {'—' | '--'}   yinYang          - 本卦阴阳
 * @property {boolean}       isChanged        - 是否为动爻
 * @property {'—' | '--'}   [changedYinYang]  - 变卦阴阳
 * @property {NaJia | null}  naJia            - 纳甲信息
 * @property {string[]}      [shenSha]        - 神煞列表
 * @property {string}        [dongYaoEffect]  - 动爻效应（进退、反伏等）
 */

/**
 * @typedef {object} GuaPan
 * @property {string}            question          - 所问之事
 * @property {Date}              startTime         - 起卦时间
 * @property {string}            lunarMonth        - 月建
 * @property {string}            lunarDay          - 日辰
 * @property {[string, string]}  xunKong           - 旬空
 * @property {string}            benGuaName        - 本卦名
 * @property {string}            bianGuaName       - 变卦名
 * @property {number[]}          dongYaoIndexes    - 动爻索引
 * @property {Yao[]}             yaoList           - 六爻列表
 * @property {string}            yongShen          - 用神
 * @property {number}            shiYaoIndex       - 世爻索引
 * @property {number}            yingYaoIndex      - 应爻索引
 * @property {string}            gongName          - 宫名
 * @property {string}            gongWuxing        - 宫五行
 * @property {FuShen}            [fuShen]          - 伏神信息
 * @property {string}            [yuanShen]        - 元神
 * @property {string}            [jiShen]          - 忌神
 * @property {string}            [chouShen]        - 仇神
 * @property {'六合' | '六冲' | '反吟' | '伏吟' | ''} [pattern] - 卦象格局
 * @property {string[]}          [yingQiCandidates] - 应期候选
 */

/**
 * @typedef {object} Analysis
 * @property {string}             yongShen          - 用神
 * @property {Yao | null}         yongShenYao       - 用神所在爻
 * @property {boolean}            isFuShen          - 是否伏神
 * @property {string}             relationToShi     - 与世爻关系
 * @property {'旺' | '衰' | '平'} strength          - 用神旺衰
 * @property {string}             [yuanShen]        - 元神
 * @property {string}             [jiShen]          - 忌神
 * @property {string}             [chouShen]        - 仇神
 * @property {string[]}           dongYaoEffects    - 动爻效应
 * @property {'六合' | '六冲' | '反吟' | '伏吟' | ''} [pattern] - 卦象格局
 * @property {string[]}           shenShaEffects    - 神煞影响
 * @property {string[]}           yingQiCandidates  - 应期候选
 * @property {string}             conclusion        - 解卦结论
 */
