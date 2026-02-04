<template>
  <div class="annotator">
    <h2>✏️ 图片标注</h2>
    
    <div class="toolbar">
      <div class="tool-group">
        <button @click="setTool('select')" :class="{ active: tool === 'select' }">🖱️ 选择</button>
        <button @click="setTool('draw')" :class="{ active: tool === 'draw' }">✏️ 画笔</button>
        <button @click="setTool('highlight')" :class="{ active: tool === 'highlight' }">🖍️ 高亮</button>
        <button @click="setTool('arrow')" :class="{ active: tool === 'arrow' }">➡️ 箭头</button>
        <button @click="setTool('rect')" :class="{ active: tool === 'rect' }">⬜ 矩形</button>
        <button @click="setTool('circle')" :class="{ active: tool === 'circle' }">⭕ 圆形</button>
        <button @click="setTool('text')" :class="{ active: tool === 'text' }">🔤 文字</button>
        <button @click="setTool('mosaic')" :class="{ active: tool === 'mosaic' }">🔲 马赛克</button>
        <button @click="setTool('blur')" :class="{ active: tool === 'blur' }">🌫️ 模糊</button>
      </div>
      <div class="tool-group">
        <label>
          颜色:
          <input type="color" v-model="color" />
        </label>
        <label>
          粗细:
          <input type="range" v-model="strokeWidth" min="1" max="20" />
        </label>
      </div>
      <div class="tool-group">
        <button @click="undo" :disabled="history.length === 0">↩️ 撤销</button>
        <button @click="redo" :disabled="redoStack.length === 0">↪️ 重做</button>
        <button @click="clear" class="danger">🗑️ 清除</button>
      </div>
      <div class="tool-group">
        <button @click="download">💾 下载</button>
        <button @click="copy">📋 复制</button>
      </div>
    </div>

    <div v-if="!image" class="upload-area" @drop.prevent="handleDrop" @dragover.prevent>
      <div class="placeholder">
        <p>📋 拖拽图片到这里开始标注</p>
        <p class="hint">或点击上传</p>
        <label class="upload-btn">
          📁 选择图片
          <input type="file" accept="image/*" @change="uploadImage" hidden />
        </label>
      </div>
    </div>

    <div v-else class="canvas-workspace" ref="workspace">
      <canvas 
        ref="canvasRef"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const tool = ref('select')
const color = ref('#ff0000')
const strokeWidth = ref(3)
const image = ref(null)
const canvasRef = ref(null)
const workspace = ref(null)
const isDrawing = ref(false)
const history = ref([])
const redoStack = ref([])
let ctx = null
let startX = 0
let startY = 0
let snapshot = null

const pendingImage = localStorage.getItem('pendingImage')

const usePending = () => {
  if (pendingImage) {
    image.value = pendingImage
    localStorage.removeItem('pendingImage')
    initCanvas()
  }
}

const uploadImage = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        image.value = ev.target.result
        initCanvas()
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        image.value = ev.target.result
        initCanvas()
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }
}

const initCanvas = () => {
  const img = new Image()
  img.onload = () => {
    const canvas = canvasRef.value
    canvas.width = img.width
    canvas.height = img.height
    ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    saveState()
  }
  img.src = image.value
}

const setTool = (t) => { tool.value = t }

const saveState = () => {
  const canvas = canvasRef.value
  history.value.push(canvas.toDataURL())
  if (history.value.length > 20) history.value.shift()
  redoStack.value = []
}

const undo = () => {
  if (history.value.length > 1) {
    redoStack.value.push(history.value.pop())
    restoreState(history.value[history.value.length - 1])
  }
}

const redo = () => {
  if (redoStack.value.length > 0) {
    const state = redoStack.value.pop()
    history.value.push(state)
    restoreState(state)
  }
}

const restoreState = (dataUrl) => {
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.drawImage(img, 0, 0)
  }
  img.src = dataUrl
}

const clear = () => {
  if (confirm('清除所有标注?')) {
    initCanvas()
  }
}

const startDrawing = (e) => {
  if (!image.value) return
  isDrawing.value = true
  const rect = canvasRef.value.getBoundingClientRect()
  startX = e.clientX - rect.left
  startY = e.clientY - rect.top
  snapshot = canvasRef.value.toDataURL()
}

const draw = (e) => {
  if (!isDrawing.value.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const w = x - startX
  const h = y - startY
  
  // Restore snapshot for preview
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0)
    drawShape(x, y, w, h)
  }
  img.src = snapshot
}

const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    saveState()
  }
}

const drawShape = (x, y, w, h) => {
  ctx.strokeStyle = color.value
  ctx.fillStyle = color.value + '40'
  ctx.lineWidth = strokeWidth.value
  
  if (tool.value === 'arrow') {
    drawArrow(ctx, startX, startY, x, y)
  } else if (tool.value === 'rect') {
    ctx.strokeRect(startX, startY, w, h)
  } else if (tool.value === 'circle') {
    ctx.beginPath()
    ctx.ellipse(startX + w/2, startY + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (tool.value === 'text') {
    ctx.font = `${strokeWidth.value * 8}px sans-serif`
    ctx.fillText('点击输入文字', startX, startY)
  } else if (tool.value === 'mosaic') {
    mosaicArea(startX, startY, w, h)
  }
}

const drawArrow = (ctx, fromX, fromY, toX, toY) => {
  const headlen = 15
  const angle = Math.atan2(toY - fromY, toX - fromX)
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
  ctx.moveTo(toX, toY)
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
  ctx.stroke()
}

const mosaicArea = (x, y, w, h) => {
  const imageData = ctx.getImageData(x, y, w, h)
  const size = 10
  for (let py = 0; py < h; py += size) {
    for (let px = 0; px < w; px += size) {
      let r = 0, g = 0, b = 0, count = 0
      for (let dy = 0; dy < size && py + dy < h; dy++) {
        for (let dx = 0; dx < size && px + dx < w; dx++) {
          const i = ((py + dy) * w + (px + dx)) * 4
          r += imageData.data[i]
          g += imageData.data[i + 1]
          b += imageData.data[i + 2]
          count++
        }
      }
      r = Math.floor(r / count)
      g = Math.floor(g / count)
      b = Math.floor(b / count)
      for (let dy = 0; dy < size && py + dy < h; dy++) {
        for (let dx = 0; dx < size && px + dx < w; dx++) {
          const i = ((py + dy) * w + (px + dx)) * 4
          imageData.data[i] = r
          imageData.data[i + 1] = g
          imageData.data[i + 2] = b
        }
      }
    }
  }
  ctx.putImageData(imageData, x, y)
}

const download = () => {
  const link = document.createElement('a')
  link.download = `annotated-${Date.now()}.png`
  link.href = canvasRef.value.toDataURL()
  link.click()
}

const copy = async () => {
  try {
    const blob = await new Promise(resolve => canvasRef.value.toBlob(resolve))
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    alert('已复制到剪贴板!')
  } catch (e) {
    alert('复制失败: ' + e.message)
  }
}

onMounted(() => {
  if (pendingImage) usePending()
})
</script>

<style scoped>
.annotator { padding: 20px; }
h2 { margin-bottom: 20px; color: #f0f6fc; }
.toolbar { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.tool-group { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
.tool-group button {
  padding: 8px 12px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #c9d1d9;
  cursor: pointer;
  font-size: 13px;
}
.tool-group button:hover, .tool-group button.active { background: #1f6feb; border-color: #1f6feb; color: white; }
.tool-group button:disabled { opacity: 0.5; cursor: not-allowed; }
.tool-group label { display: flex; align-items: center; gap: 5px; color: #8b949e; font-size: 13px; }
.tool-group input[type="color"] { width: 30px; height: 30px; border: none; border-radius: 4px; cursor: pointer; }
.tool-group input[type="range"] { width: 80px; }
.upload-area {
  background: #161b22;
  border: 2px dashed #30363d;
  border-radius: 12px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder { text-align: center; color: #8b949e; }
.placeholder .hint { margin: 8px 0 15px; }
.upload-btn {
  display: inline-block;
  padding: 12px 24px;
  background: #238636;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}
.canvas-workspace { overflow: auto; background: #0d1117; border-radius: 8px; }
.canvas-workspace canvas { display: block; cursor: crosshair; }
</style>
