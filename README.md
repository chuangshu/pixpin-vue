# 📌 PixPin Vue

基于 Vue 3 的截图、OCR、标注工具。

## ✨ 功能

- 📸 **截图** - 区域/窗口/全屏截图
- 📌 **Pin 板** - 把图片钉在屏幕上
- 🔤 **OCR** - 图片文字识别
- ✏️ **标注** - 画笔、高亮、箭头、矩形、圆形、文字、马赛克

## 🚀 部署到 GitHub Pages

```bash
# 1. 创建 GitHub 仓库
# 2. 推送代码
git remote add origin https://github.com/你的用户名/pixpin-vue.git
git branch -M main
git push -u origin main

# 3. 启用 GitHub Pages
# Settings → Pages → Source: "main" → Save

# 4. 访问
# https://你的用户名.github.io/pixpin-vue/
```

## 🛠️ 本地开发

```bash
npm install
npm run dev
npm run build
```

## 📁 项目结构

```
src/
├── components/
│   ├── Screenshot.vue   # 截图
│   ├── PinBoard.vue     # Pin 板
│   ├── OCR.vue          # OCR 识别
│   └── Annotator.vue    # 图片标注
├── App.vue
└── main.js
```

## 📦 技术栈

- Vue 3 + Vite
- html2canvas（截图）
- Tesseract.js（OCR）
- 原生 Canvas API（标注）

## 📄 许可证

MIT
