<template>
  <div class="app">
    <header class="header">
      <h1>📌 PixPin Vue</h1>
      <div class="lang-switch">
        <button @click="lang = 'zh'" :class="{ active: lang === 'zh' }">中文</button>
        <button @click="lang = 'en'" :class="{ active: lang === 'en' }">EN</button>
      </div>
    </header>
    
    <main class="main">
      <div class="shortcuts">
        <h2>⌨️ {{ lang === 'zh' ? '快捷键' : 'Keyboard Shortcuts' }}</h2>
        <div class="shortcut-list">
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> {{ lang === 'zh' ? '截图' : 'Screenshot' }}</div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd> OCR</div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> {{ lang === 'zh' ? 'Pin板' : 'Pin Board' }}</div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> {{ lang === 'zh' ? '粘贴图片' : 'Paste Image' }}</div>
        </div>
      </div>

      <div class="features">
        <h2>🔧 {{ lang === 'zh' ? '功能' : 'Features' }}</h2>
        <div class="feature-grid">
          <router-link to="/screenshot" class="feature-card">
            <span class="icon">📸</span>
            <h3>{{ lang === 'zh' ? '截图' : 'Screenshot' }}</h3>
            <p>{{ lang === 'zh' ? '区域/全屏/长截图' : 'Area / Fullscreen / Long' }}</p>
          </router-link>
          <router-link to="/pin" class="feature-card">
            <span class="icon">📌</span>
            <h3>Pin {{ lang === 'zh' ? '图钉' : 'Board' }}</h3>
            <p>{{ lang === 'zh' ? '把图片钉在屏幕上' : 'Pin images to screen' }}</p>
          </router-link>
          <router-link to="/ocr" class="feature-card">
            <span class="icon">🔤</span>
            <h3>OCR</h3>
            <p>{{ lang === 'zh' ? '图片文字识别' : 'Extract text from images' }}</p>
          </router-link>
          <router-link to="/annotator" class="feature-card">
            <span class="icon">✏️</span>
            <h3>{{ lang === 'zh' ? '标注' : 'Annotate' }}</h3>
            <p>{{ lang === 'zh' ? '画笔/箭头/马赛克' : 'Draw / Arrow / Mosaic' }}</p>
          </router-link>
        </div>
      </div>

      <div class="upload-section">
        <h2>📁 {{ lang === 'zh' ? '上传图片试用' : 'Upload Image to Test' }}</h2>
        <div class="upload-area" @drop.prevent="handleDrop" @dragover.prevent>
          <input type="file" accept="image/*" @change="handleUpload" ref="fileInput" hidden />
          <div class="upload-content" @click="$refs.fileInput.click()">
            <span class="icon">🖼️</span>
            <p>{{ lang === 'zh' ? '点击或拖拽上传图片' : 'Click or drag image here' }}</p>
            <p class="hint">PNG, JPG, GIF</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const lang = ref('zh')
const fileInput = ref(null)

const handleUpload = (e) => {
  const file = e.target.files[0]
  if (file) processFile(file)
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (ev) => {
    localStorage.setItem('pendingImage', ev.target.result)
    router.push('/ocr')
  }
  reader.readAsDataURL(file)
}

const handleKeydown = (e) => {
  if (e.ctrlKey && e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case 's': e.preventDefault(); router.push('/screenshot'); break
      case 'o': e.preventDefault(); router.push('/ocr'); break
      case 'p': e.preventDefault(); router.push('/pin'); break
      case 'v': e.preventDefault(); pasteImage(); break
    }
  }
}

const pasteImage = async () => {
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          const reader = new FileReader()
          reader.onload = (ev) => {
            localStorage.setItem('pendingImage', ev.target.result)
            router.push('/ocr')
          }
          reader.readAsDataURL(blob)
          return
        }
      }
    }
    alert(lang.value === 'zh' ? '剪贴板中没有图片' : 'No image in clipboard')
  } catch (e) {
    alert(lang.value === 'zh' ? '无法读取剪贴板' : 'Cannot read clipboard')
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.app { min-height: 100vh; background: #0d1117; color: #c9d1d9; }
.header { 
  background: #161b22; padding: 15px 20px; border-bottom: 1px solid #30363d;
  display: flex; justify-content: space-between; align-items: center;
}
.header h1 { font-size: 24px; color: #58a6ff; margin: 0; }
.lang-switch { display: flex; gap: 5px; }
.lang-switch button {
  padding: 6px 12px; background: #21262d; border: 1px solid #30363d;
  border-radius: 6px; color: #8b949e; cursor: pointer;
}
.lang-switch button.active { background: #1f6feb; border-color: #1f6feb; color: white; }
.main { max-width: 900px; margin: 0 auto; padding: 30px 20px; }
.shortcuts, .features, .upload-section { margin-bottom: 40px; }
h2 { font-size: 18px; color: #f0f6fc; margin-bottom: 15px; }
.shortcut-list { display: flex; flex-wrap: wrap; gap: 10px; }
.shortcut-item {
  background: #21262d; padding: 8px 16px; border-radius: 8px; font-size: 14px;
}
kbd {
  background: #30363d; padding: 2px 8px; border-radius: 4px; font-family: monospace;
  margin: 0 3px;
}
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
.feature-card {
  background: #161b22; border: 1px solid #30363d; border-radius: 12px;
  padding: 20px; text-align: center; cursor: pointer;
  transition: all 0.2s; text-decoration: none; color: inherit;
}
.feature-card:hover { border-color: #58a6ff; transform: translateY(-3px); }
.feature-card .icon { font-size: 36px; display: block; margin-bottom: 10px; }
.feature-card h3 { font-size: 16px; color: #f0f6fc; margin: 0 0 5px; }
.feature-card p { font-size: 13px; color: #8b949e; margin: 0; }
.upload-area {
  background: #161b22; border: 2px dashed #30363d; border-radius: 12px;
  min-height: 150px; cursor: pointer; transition: all 0.2s;
}
.upload-area:hover { border-color: #58a6ff; }
.upload-content {
  padding: 40px; text-align: center;
}
.upload-content .icon { font-size: 40px; }
.upload-content p { margin: 10px 0 0; color: #8b949e; }
.upload-content .hint { font-size: 12px; }
</style>
