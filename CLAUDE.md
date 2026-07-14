# CLAUDE.md — 六爻排盘解卦

## 项目概述
基于京房纳甲六爻理论的排盘与解卦 PWA 工具。Vue 3 + Vite 5 + Pinia，原生 Canvas 渲染，anime.js 动画。

## 常用命令
| 命令 | 用途 |
|:---|:---|
| `npm run dev` | 开发服务器 (Vite) |
| `npm run build` | 生产构建 → `dist/` |
| `npm run test` | Vitest 全量测试 (63 tests, 5 suites) |
| `npm run preview` | 预览生产构建 |

## 核心模块
| 文件 | 职责 |
|:---|:---|
| `src/engine/paipan.js` | 装卦引擎（纯函数）：寻宫定世应 → 纳甲 → 六亲 → 六神 → 旬空 → 伏神飞神；新增 guaType（游魂/归魂）、changedDiZhi |
| `src/engine/analyze.js` | 解卦引擎（纯函数）：13类问题识别 → 用神定位 → 旺衰评分(6档) → 进退神 → 反吟伏吟 → 回头克/化墓绝 → 三合局 → 神煞 → 应期 → 通俗+专业双版本断语 |
| `src/renderer/canvasRenderer.js` | Canvas 卦图绘制 + PNG/PDF 导出；阳阴爻线等宽(36px)，动爻×○标记 |
| `src/data/constants.js` | 八卦/八宫64卦/纳甲/六亲/六神/神煞/六十甲子；用神关键词25+词/六亲 |
| `src/utils/lunar.js` | 日干支计算（基准1900-01-01甲戌日）+ 旬空 |
| `src/utils/shake.js` | 摇卦逻辑（三枚铜钱模拟） |
| `src/utils/storage.js` | localStorage 卦例 CRUD，存储 guaPan + analysis |
| `src/stores/guaStore.js` | Pinia 全局状态（摇卦→装卦→解卦流程），isViewing 查看模式，autoSave |
| `src/stores/toastStore.js` | Toast 通知状态管理（success/error/info） |
| `src/views/ShakePage.vue` | 摇卦交互页（龟壳动画 + 自动连续摇6次 + 爻线CSS渲染） |
| `src/views/ResultPage.vue` | 解卦结果页（Canvas 卦图 + 分析卡片：用神/原忌仇/动爻/格局/神煞/应期/建议） |
| `src/views/HistoryPage.vue` | 卦例历史页（×按钮直接删除，点击查看完整分析） |
| `src/components/ui/` | Toast / FadeContent / SpotlightCard / ClickSpark（来自 ui-kit） |

## 技术要点
- **动画**：anime.js v4（npm 包 `animejs`），stagger 为独立命名导出，用于龟壳弹簧摇动 + 铜钱翻转
- **PWA**：vite-plugin-pwa，离线预缓存 14 个资源
- **不可变性**：引擎层所有函数为纯函数，使用展开运算符返回新对象
- **测试**：paipan(24) + analyze(15) + lunar(10) + shake(7) + storage(7) = 63 tests, 全部通过
- **数据流**：摇卦 → buildGuaPan → GuaPan → analyze → Analysis → Canvas 渲染 + 卡片展示
- **爻象**：CSS gradient 渲染阳爻直线/阴爻虚线等宽；动爻 ○（阳变）×（阴变）
- **自动保存**：解卦完成后自动 saveRecord(guaPan, analysis)，无需手动操作
- **查看模式**：store.isViewing 区分新结果/历史查看，按钮文字不同

## 当前状态 (2026-07-15)
- ✅ 构建通过（101 modules, PWA 14 precache）
- ✅ 全量测试通过（5 suites / 63 tests）
- ✅ 分析引擎 v2：13类问题 + 25+用神关键词 + 6档旺衰评分 + 双版本断语
- ✅ 交互优化：自动连续摇卦 + Toast 通知 + 自动保存 + 历史查看模式
- ✅ 视觉修复：爻线CSS等宽 + ClickSpark修复 + 输入框溢出修复

## CodeGraph 使用规范

### [HARD] 代码检索优先使用 CodeGraph
- 进行数据或代码检索时，**优先使用 CodeGraph**（`codegraph_context`、`codegraph_search`、`codegraph_trace` 等工具）
- CodeGraph 无法满足需求时，才回退到 Grep/Glob/Read 等传统方式

### [HARD] 重大改动后增量更新
- 当项目发生以下情况时，执行 `codegraph sync` 进行增量索引更新：
  - 文档对齐（CLAUDE.md、README、docs/ 等变更）
  - 重大代码改动（新增模块、架构调整、重构）
  - 新增依赖或外部集成
- 日常小改动（bug 修复、小功能追加）不需要强制同步
