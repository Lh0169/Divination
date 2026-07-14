# 六爻排盘解卦 Divination

基于传统**京房纳甲六爻**理论的排盘与解卦 PWA 工具。

输入问题、自动摇卦、装卦排盘、白话解卦，支持 PNG/PDF 导出。

## ✨ 功能

- 🎲 **自动摇卦** — 点击开始后自动摇 6 次，龟壳摇晃 + 铜钱翻转动画
- 📊 **完整装卦** — 纳甲、六亲、六神、世应、旬空、伏神飞神
- 🔍 **智能解卦** — 13 类问题自动识别（财运/事业/感情/健康/学业/寻物……）
- 💬 **白话断语** — 零术语的生活化建议 + 专业断语，双版本对照
- 📤 **导出** — Canvas 卦图 PNG 下载 / 浏览器 PDF 打印
- 📱 **PWA** — 离线可用，可添加到手机主屏

## 🚀 快速开始

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # → dist/
npm run test     # 63 tests
```

## 📁 项目结构

```
src/
├── engine/          # 装卦引擎 + 解卦引擎（纯函数）
│   ├── paipan.js    # 寻宫定世应 → 纳甲 → 六亲 → 六神 → 旬空
│   └── analyze.js   # 用神定位 → 旺衰 → 格局 → 神煞 → 应期 → 断语
├── renderer/        # Canvas 卦图绘制 + PNG/PDF 导出
├── data/            # 八卦/八宫64卦/纳甲/六亲/六神/神煞 静态数据
├── utils/           # 日干支计算 / 摇卦 / 存储
├── stores/          # Pinia 状态管理 + Toast 通知
├── views/           # 摇卦页 / 结果页 / 历史页
└── components/ui/   # Toast / FadeContent / SpotlightCard / ClickSpark
```

## 🛠 技术栈

Vue 3 · Vite 5 · Pinia · Vue Router · anime.js 4.5 · Canvas · PWA · Vitest

## 📄 License

MIT
