/**
 * @file 卦图 Canvas 绘制基础原语和样式常量
 * 所有坐标参数化，方便 drawGuaPan 调用。
 */

// ── 样式常量 ────────────────────────────────────────────────

export const DEFAULT_STYLE = {
  canvasWidth: 460, canvasHeight: 600, scale: 2,
  bgColor: '#f5f0e8', borderColor: '#8b7355',
  textColor: '#333333', accentColor: '#c0392b',
  secondaryColor: '#666666', mutedColor: '#999999',
  titleFont: 'bold 22px "KaiTi","STKaiti","楷体",serif',
  headerFont: 'bold 14px "KaiTi","STKaiti","楷体",serif',
  bodyFont: '14px "KaiTi","STKaiti","楷体",serif',
  smallFont: '11px "KaiTi","STKaiti","楷体",serif',
  padding: 20, rowHeight: 48, headerHeight: 32, titleY: 40,
  colWidths: [60, 30, 60, 70, 45, 60, 70],
  borderRadius: 8, lineWidth: 2
};

// ── 内部工具 ────────────────────────────────────────────────

function getColCenters(pad, widths) {
  const xs = [];
  let x = pad;
  for (const w of widths) { xs.push(x + w / 2); x += w; }
  return xs;
}

function s(style) { return style || DEFAULT_STYLE; }

// ── 绘制原语 ────────────────────────────────────────────────

/** 仿古纸背景 + 圆角边框 */
export function drawBackground(ctx, w, h, style) {
  const st = s(style);
  ctx.save();
  ctx.fillStyle = st.bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = st.borderColor;
  ctx.lineWidth = st.lineWidth;
  const r = st.borderRadius;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  ctx.lineTo(w, h - r); ctx.arcTo(w, h, w - r, h, r);
  ctx.lineTo(r, h); ctx.arcTo(0, h, 0, h - r, r);
  ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/** 居中标题 */
export function drawTitle(ctx, text, x, y, style) {
  const st = s(style);
  ctx.save();
  ctx.font = st.titleFont;
  ctx.fillStyle = st.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * 单条爻线。阳爻实线，阴爻两段虚线，总长等宽。
 * 动爻右侧加红色圆圈。
 */
export function drawYaoLine(ctx, x, y, yinYang, isChanged, style) {
  const st = s(style);
  const half = 18;
  ctx.save();
  ctx.strokeStyle = isChanged ? st.accentColor : st.textColor;
  ctx.lineWidth = st.lineWidth;
  ctx.lineCap = 'round';
  if (yinYang === '—') {
    ctx.beginPath(); ctx.moveTo(x - half, y); ctx.lineTo(x + half, y); ctx.stroke();
  } else {
    const seg = 14;
    ctx.beginPath(); ctx.moveTo(x - half, y); ctx.lineTo(x - half + seg, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + half - seg, y); ctx.lineTo(x + half, y); ctx.stroke();
  }
  // 动爻标记：阴变→×，阳变→○
  if (isChanged) {
    ctx.fillStyle = st.accentColor;
    ctx.font = 'bold 13px "STKaiti","KaiTi","楷体",serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(yinYang === '—' ? '○' : '×', x + half + 12, y);
  }
  ctx.restore();
}

/**
 * 文本标签。options: { align, color, font, baseline }
 */
export function drawLabel(ctx, text, x, y, options) {
  ctx.save();
  const opt = options || {};
  ctx.font = opt.font || DEFAULT_STYLE.bodyFont;
  ctx.fillStyle = opt.color || DEFAULT_STYLE.textColor;
  ctx.textAlign = opt.align || 'center';
  ctx.textBaseline = opt.baseline || 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 表头行 */
export function drawColumnHeader(ctx, headers, y, style) {
  const st = s(style);
  const centers = getColCenters(st.padding, st.colWidths);
  ctx.save();
  ctx.font = st.headerFont;
  ctx.fillStyle = st.secondaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < Math.min(headers.length, centers.length); i++) {
    ctx.fillText(headers[i], centers[i], y);
  }
  ctx.restore();
}

/**
 * 单行爻数据。七列：六亲 / 世应 / 爻画 / 地支 / 五行 / 六神 / 神煞
 * @param {import('../types').Yao} yao
 */
export function drawRow(ctx, yao, y, options) {
  const opt = options || {};
  const st = s(opt.style);
  const centers = getColCenters(st.padding, st.colWidths);
  const cy = y + st.rowHeight / 2;
  ctx.save();
  const tc = yao.isChanged ? st.accentColor : st.textColor;
  if (yao.naJia && yao.naJia.liuQin) {
    drawLabel(ctx, yao.naJia.liuQin, centers[0], cy, { font: st.bodyFont, color: tc });
  }
  if (yao.naJia && yao.naJia.shiYing) {
    drawLabel(ctx, yao.naJia.shiYing, centers[1], cy, { font: st.bodyFont, color: st.accentColor });
  }
  drawYaoLine(ctx, centers[2], cy, yao.yinYang, yao.isChanged, st);
  if (yao.naJia && yao.naJia.diZhi) {
    drawLabel(ctx, yao.naJia.diZhi, centers[3], cy, { font: st.bodyFont, color: tc });
  }
  if (yao.naJia && yao.naJia.wuXing) {
    drawLabel(ctx, yao.naJia.wuXing, centers[4], cy, { font: st.bodyFont, color: tc });
  }
  if (yao.naJia && yao.naJia.liuShen) {
    drawLabel(ctx, yao.naJia.liuShen, centers[5], cy, { font: st.bodyFont, color: tc });
  }
  if (yao.shenSha && yao.shenSha.length > 0) {
    drawLabel(ctx, yao.shenSha.join(' '), centers[6], cy, { font: st.smallFont, color: st.mutedColor });
  }
  ctx.restore();
}

/** 分隔线 */
export function drawSeparator(ctx, y, style) {
  const st = s(style);
  ctx.save();
  ctx.strokeStyle = st.borderColor;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(st.padding, y);
  ctx.lineTo(st.colWidths.reduce((s, w) => s + w, st.padding), y);
  ctx.stroke();
  ctx.restore();
}

/** 页脚免责声明 */
export function drawFooter(ctx, text, w, h, style) {
  const st = s(style);
  ctx.save();
  ctx.font = st.smallFont;
  ctx.fillStyle = st.mutedColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, w / 2, h - st.padding / 2);
  ctx.restore();
}

// ── 卦盘组合绘制 ────────────────────────────────────────────

/**
 * 绘制完整卦盘，从标题到页脚。
 * guaPan 结构: { benGua, bianGua, meta, yaos, question }
 * 每行 yao 的 naJia 字段包含 liuQin/shiYing/diZhi/liuShen 等。
 */
export function drawGuaPan(ctx, guaPan, options = {}) {
  const style = { ...DEFAULT_STYLE, ...options };
  const w = style.canvasWidth;
  const h = style.canvasHeight;
  const cx = w / 2;

  drawBackground(ctx, w, h, style);

  // 标题: [本卦名] → [变卦名]
  const titleText = guaPan.bianGuaName
    ? `${guaPan.benGuaName || ''} → ${guaPan.bianGuaName}`
    : (guaPan.benGuaName || '六爻卦盘');
  drawTitle(ctx, titleText, cx, style.titleY, style);

  // 副标题: 月建 日辰 旬空 宫
  let y = style.titleY + 30;
  const metaParts = [];
  if (guaPan.lunarMonth) metaParts.push(`月建:${guaPan.lunarMonth}`);
  if (guaPan.lunarDay)   metaParts.push(`日辰:${guaPan.lunarDay}`);
  if (guaPan.xunKong && guaPan.xunKong.length === 2) {
    metaParts.push(`旬空:${guaPan.xunKong[0]}${guaPan.xunKong[1]}`);
  }
  if (guaPan.gongName)   metaParts.push(`宫:${guaPan.gongName}${guaPan.gongWuxing || ''}`);
  if (metaParts.length > 0) {
    drawLabel(ctx, metaParts.join('  '), cx, y, { font: style.bodyFont, color: style.secondaryColor });
  }

  // 表头
  y = 90;
  drawColumnHeader(ctx, ['六亲', '世应', '爻', '地支', '五行', '六神', '神煞'], y, style);

  y += style.headerHeight / 2 + 4;
  drawSeparator(ctx, y, style);

  // 6 行爻（从上爻 index=5 到初爻 index=0）
  y = 120;
  if (guaPan.yaoList && Array.isArray(guaPan.yaoList)) {
    const centers = getColCenters(style.padding, style.colWidths);
    for (let i = 5; i >= 0; i--) {
      const yao = guaPan.yaoList[i];
      if (!yao) continue;

      drawRow(ctx, yao, y, { style });

      // 动爻变卦信息小字标注
      if (yao.isChanged && yao.changedYinYang) {
        drawLabel(ctx, `→${yao.changedYinYang}`, centers[2], y + style.rowHeight / 2 + 12, {
          font: style.smallFont, color: style.accentColor
        });
      }

      // 伏神行（按 yaoIndex 匹配）
      const fShen = guaPan.fuShen;
      const hasFuHere = fShen && fShen.yaoIndex === yao.index;
      if (hasFuHere) {
        const fy = y + style.rowHeight + 8;
        drawLabel(ctx, `伏:${fShen.fuLiuQin}${fShen.fuDiZhi} (${fShen.relation})`, centers[3], fy, {
          font: style.smallFont, color: style.mutedColor
        });
      }

      y += hasFuHere ? style.rowHeight + 24 : style.rowHeight;
    }
  }

  // 格局 & 应期
  if (guaPan.pattern || (guaPan.yingQiCandidates && guaPan.yingQiCandidates.length)) {
    y += 8;
    if (guaPan.pattern) {
      drawLabel(ctx, `格局: ${guaPan.pattern}`, cx, y, { font: style.smallFont, color: style.accentColor });
      y += 16;
    }
    if (guaPan.yingQiCandidates && guaPan.yingQiCandidates.length) {
      drawLabel(ctx, `应期: ${guaPan.yingQiCandidates.join('、')}`, cx, y, { font: style.smallFont, color: style.secondaryColor });
    }
  }

  // 页脚
  drawFooter(ctx, '结果仅供娱乐参考', w, h, style);
}

// ── 导出工具 ────────────────────────────────────────────────

/** Canvas 缓存 */
const canvasCache = new WeakMap()

/** 返回绘好的 Canvas DOM 元素，供 Vue 组件通过 ref 挂载 */
export function exportToCanvas(guaPan, options = {}) {
  // 检查缓存
  if (canvasCache.has(guaPan)) {
    const cachedCanvas = canvasCache.get(guaPan)
    // 验证缓存是否有效
    if (cachedCanvas && cachedCanvas.width > 0) {
      return cachedCanvas
    }
  }

  const style = { ...DEFAULT_STYLE, ...options };
  const canvas = document.createElement('canvas');
  canvas.width = style.canvasWidth;
  canvas.height = style.canvasHeight;
  const ctx = canvas.getContext('2d');
  drawGuaPan(ctx, guaPan, options);

  // 缓存 canvas
  canvasCache.set(guaPan, canvas)
  return canvas;
}

/** Canvas → toDataURL → 触发 PNG 下载 */
export function exportPNG(guaPan, options = {}) {
  try {
    const scale = options.scale || DEFAULT_STYLE.scale || 2;
    const w = (options.width || DEFAULT_STYLE.canvasWidth);
    const h = (options.height || DEFAULT_STYLE.canvasHeight);
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    drawGuaPan(ctx, guaPan, options);

    const link = document.createElement('a');
    // 清理文件名中的非法字符
    const safeName = (guaPan.question || '卦盘')
      .replace(/[<>:"/\\|?*]/g, '')
      .trim() || '卦盘'
    link.download = `${safeName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('导出 PNG 失败:', error)
    throw new Error('导出 PNG 失败，请重试')
  }
}

/** Canvas → 图片 → 新窗口 → window.print()（用户另存为 PDF） */
export function exportPDF(guaPan, options = {}) {
  try {
    const canvas = exportToCanvas(guaPan, options);
    const imgData = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) {
      throw new Error('无法打开新窗口，请检查浏览器弹窗设置')
    }
    win.document.write(`<img src="${imgData}" style="max-width:100%">`);
    win.document.title = guaPan.question || '卦盘';
    win.document.close();
    win.focus();
    win.print();
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    throw error
  }
}
