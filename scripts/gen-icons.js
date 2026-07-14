// 生成 PWA 图标占位符 (192x192 + 512x512)
// 运行方式: node scripts/gen-icons.js
// 依赖: npm install canvas (一次性)
//
// 如果无法安装 canvas，请使用在线工具生成图标:
// https://realfavicongenerator.net/ 或 https://www.pwabuilder.com/

const fs = require('fs');
try {
  const { createCanvas } = require('canvas');

  function generateIcon(size, outputPath) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 红色背景
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(0, 0, size, size);

    // 白色 "爻" 字
    ctx.fillStyle = '#ffffff';
    const fontSize = Math.floor(size * 0.55);
    ctx.font = `bold ${fontSize}px "STKaiti","KaiTi","楷体",serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('爻', size / 2, size / 2);

    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buf);
    console.log(`已生成: ${outputPath} (${size}x${size})`);
  }

  generateIcon(192, 'public/icon-192.png');
  generateIcon(512, 'public/icon-512.png');
  console.log('PWA 图标生成完成！');
} catch (e) {
  console.log('canvas 模块未安装，请手动生成图标或运行: npm install canvas');
  console.log('然后重新执行: node scripts/gen-icons.js');
}
