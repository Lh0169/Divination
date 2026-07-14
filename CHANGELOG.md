# CHANGELOG

## v2.2.0 (2026-07-15)

### 分析引擎全面增强
- **13 类问题类型**：新增寻物、迁移、选择、人际、子嗣、官司 6 种场景识别
- **用神关键词 3× 扩充**：每个六亲从 10 词扩至 25+ 词，覆盖大量口语表达
- **格局检测增强**：新增三合局、游魂/归魂、全局伏吟/反吟、回头克、化墓/化绝
- **旺衰评分制**：月建±2、日辰±1、空亡-2、月破-3、日破-1（6 档评分）

### 解卦结论人性化
- **通俗 + 专业双版本**：综断、应期均采用"人话解释（专业术语）"格式
- **建议全部重写**：零术语，按问题类型 + 卦象状态组合生成个性化建议
- **应期通俗化**：地支→季节月份（戌→"秋末（农历九月前后）"），不再用生肖日
- **段落构建重构**：每个区域独立函数，非空才拼接，消除多余换行和标点

### 交互流程优化
- **自动连续摇卦**：点击开始后自动摇 6 次，龟壳 + 铜钱动画每爻间隔 800ms
- **解卦自动保存**：排卦→解卦→自动入库，无需手动点保存
- **历史查看模式**：记录详情页完整展示分析，不显示保存/重置按钮
- **Toast 通知系统**：全局替换 alert()，顶部居中自动消失

### 视觉优化
- **爻象 CSS 渲染**：阳爻直线/阴爻虚线等宽（CSS gradient 两段 + 透明间隙）
- **动爻标记**：阳变→○，阴变→×，蓝红橙色区分
- **Canvas 爻线等宽**：阳爻 36px 实线，阴爻 14px+8px+14px 同跨度
- **ClickSpark 修复**：h-full → inline-flex 解决 canvas 64591px 高度异常

### 代码质量
- anime.js v4 stagger 改为独立命名导出
- 输入框 box-sizing: border-box 修复溢出
- 摇卦中隐藏输入区和手动排卦区
- 历史删除按钮改为始终可见（×）
- 删除 guaPan 可选的必填修正（changedDiZhi、guaType、shenSha）
- CLAUDE.md + CHANGELOG.md + 项目手册.md 同步更新

## v2.1.0 (2026-07-14)

### 核心改进
- **解卦系统重构**：重写 analyze.js，结论生成从技术性描述改为结构化人性化解读
- **龟壳摇卦动画**：ShakePage 新增传统龟壳 + 三枚铜钱正反面显示 + anime.js 物理弹簧动画
- **卦图渲染优化**：修复 canvasRenderer.js 中 drawGuaPan 字段映射错误（benGuaName/yaoList/lunarMonth 等 10+ 处），修复六神和神煞显示不全
- **UI Kit 集成**：引入 FadeContent（渐入动画）、SpotlightCard（聚光灯卡片）、ClickSpark（点击粒子特效）

### 缺陷修复
- Canvas 渲染字段映射全部对齐实际 GuaPan 结构
- analyze.js 重构为纯函数，消除 assignShenSha / analyze 的副作用
- ShakePage 手动排卦改用 store action 封装，消除直接状态修改
- lunar.js 自研日干支计算（基准 1900-01-01 甲戌日）
- HistoryPage clearAll 命名冲突修复
- PWA 配置完善（manifest.json + vite-plugin-pwa + Service Worker）
- anime.js 改为 npm 包引入（animejs ^4.5.0），消除本地路径依赖

### 技术栈
- **前端**：Vue 3.4 + Vite 5.4 + Pinia 2.1 + Vue Router 4.3
- **动画**：anime.js 4.5（龟壳弹簧动画 + 铜钱翻转 stagger）
- **渲染**：原生 Canvas 绘制卦图，零依赖 PNG/PDF 导出
- **构建**：PWA 离线支持（vite-plugin-pwa 0.20）
- **测试**：Vitest 2.1，63 测试全部通过
- **质量**：纯函数引擎，JSDoc 类型标注
