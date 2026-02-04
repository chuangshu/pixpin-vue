<template>
  <div class="annotator-container">
    <div class="page-header">
      <h1>✏️ 图片标注</h1>
      <p>在图片上添加标注：绘图、高亮、马赛克、箭头</p>
    </div>
    
    <div class="annotator-content">
      <div class="toolbar-section">
        <div class="tool-group">
          <span class="tool-group-label">工具</span>
          <div class="tool-buttons">
            <button 
              v-for="tool in tools" 
              :key="tool.id"
              :class="['tool-btn', { active: currentTool === tool.id }]"
              @click="currentTool = tool.id"
              :title="tool.name"
            >
              <span class="tool-icon">{{ tool.icon }}</span>
              <span class="tool-name">{{ tool.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="tool-group" v-if="currentTool === 'draw' || currentTool === 'highlight'">
          <span class="tool-group-label">颜色</span>
          <div class="color-picker">
            <button 
              v-for="color in colors" 
              :key="color"
              :class="['color-btn', { active: selectedColor === color }]"
              :style="{ background: color }"
              @click="selectedColor = color"
            ></button>
          </div>
        </div>
        
        <div class="tool-group" v-if="currentTool === 'draw' || currentTool === 'arrow'">
          <span class="tool-group-label">线宽</span>
          <input 
            type="range" 
            v-model="strokeWidth" 
            min="1" 
            max="20" 
            class="width-slider"
          />
          <span class="width-value">{{ strokeWidth }}px</span>
        </div>
        
        <div class="tool-group" v-if="currentTool === 'mosaic'">
          <span class="tool-group-label">马赛克强度</span>
          <input 
            type="range" 
            v-model="mosaicIntensity" 
            min="5" 
            max="30" 
            class="width-slider"
          />
          <span class="width-value">{{ mosaicIntensity }}px</span>
        </div>
        
        <div class="tool-actions">
          <button class="btn btn-secondary" @click="undo" :disabled="history.length === 0">
            ↩️ 撤销
          </button>
          <button class="btn btn-secondary" @click="redo" :disabled="redoHistory.length === 0">
            ↪️ 重做
          </button>
          <button class="btn btn-secondary" @click="clearCanvas">
            🗑️ 清除
          </button>
        </div>
      </div>
      
      <div class="canvas-section">
        <div class="canvas-wrapper" ref="canvasWrapperRef">
          <canvas 
            ref="canvasRef"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @touchstart.prevent="startDrawingTouch"
            @touchmove.prevent="drawTouch"
            @touchend.prevent="stopDrawing"
          ></canvas>
          <canvas 
            ref="tempCanvasRef"
            class="temp-canvas"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
          ></canvas>
        </div>
        
        <div class="canvas-actions">
          <button class="btn btn-primary" @click="uploadImage">
            📁 上传图片
          </button>
          <button class="btn btn-secondary" @click="saveAnnotation">
            💾 保存标注
          </button>
          <button class="btn btn-secondary" @click="resetImage">
            🔄 重新开始
          </button>
        </div>
        <input 
          type="file" 
          ref="fileInputRef"
          accept="image/*" 
          @change="handleFileSelect"
          hidden
        />
      </div>
      
      <div class="layers-section">
        <div class="layers-header">
          <h3>📋 图层</h3>
          <button class="btn btn-secondary btn-sm" @click="clearAllLayers">
            清除全部
          </button>
        </div>
        <div class="layers-list">
          <div 
            v-for="(layer, index) in layers" 
            :key="layer.id"
            :class="['layer-item', { visible: !layer.hidden }]"
            @click="toggleLayer(layer)"
          >
            <span class="layer-icon">{{ getLayerIcon(layer.type) }}</span>
            <span class="layer-name">{{ layer.name }}</span>
            <button class="layer-delete" @click.stop="deleteLayer(layer)">×</button>
          </div>
          <div v-if="layers.length === 0" class="empty-layers">
            <p>还没有标注</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const canvasRef = ref(null)
const tempCanvasRef = ref(null)
const canvasWrapperRef = ref(null)
const fileInputRef = ref(null)

const currentTool = ref('draw')
const selectedColor = ref('#e94560')
const strokeWidth = ref(3)
const mosaicIntensity = ref(15)
const isDrawing = ref(false)
const currentPath = ref([])
const baseImage = ref(null)
const layers = ref([])
const history = ref([])
const redoHistory = ref([])

const tools = [
  { id: 'draw', name: '画笔', icon: '✏️' },
  { id: 'highlight', name: '高亮', icon: '🖍️' },
  { id: 'arrow', name: '箭头', icon: '➡️' },
  { id: 'rect', name: '矩形', icon: '⬜' },
  { id: 'circle', name: '圆形', icon: '⭕' },
  { id: 'mosaic', name: '马赛克', icon: '🔲' },
  { id: 'text', name: '文字', icon: '📝' }
]

const colors = [
  '#e94560',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#fcbad3',
  '#ffffff'
]

let ctx = null
let tempCtx = null
let baseCtx = null

const initCanvases = () => {
  if (!canvasRef.value || !tempCanvasRef.value) return
  
  ctx = canvasRef.value.getContext('2d')
  tempCtx = tempCanvasRef.value.getContext('2d')
  
  if (baseImage.value) {
    setupCanvasSize()
  }
}

const setupCanvasSize = () => {
  const img = baseImage.value
  const maxWidth = 900
  const maxHeight = 600
  
  let width = img.width
  let height = img.height
  
  if (width > maxWidth) {
    height = (maxWidth / width) * height
    width = maxWidth
  }
  if (height > maxHeight) {
    width = (maxHeight / height) * width
    height = maxHeight
  }
  
  canvasRef.value.width = width
  canvasRef.value.height = height
  canvasRef.value.style.width = width + 'px'
  canvasRef.value.style.height = height + 'px'
  
  tempCanvasRef.value.width = width
  tempCanvasRef.value.height = height
  tempCanvasRef.value.style.width = width + 'px'
  tempCanvasRef.value.style.height = height + 'px'
  
  if (ctx && baseCtx) {
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(baseCtx.canvas, 0, 0, width, height)
  }
}

const loadBaseImage = (src) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    baseImage.value = img
    
    // 创建基础画布
    const baseCanvas = document.createElement('canvas')
    baseCanvas.width = img.width
    baseCanvas.height = img.height
    baseCtx = baseCanvas.getContext('2d')
    baseCtx.drawImage(img, 0, 0)
    
    nextTick(() => {
      initCanvases()
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvasRef.value.width, canvasRef.value.height)
      }
    })
  }
  img.src = src
}

const startDrawing = (e) => {
  if (!baseImage.value) return
  
  isDrawing.value = true
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  currentPath.value = [{ x, y }]
  
  tempCtx.clearRect(0, 0, tempCanvasRef.value.width, tempCanvasRef.value.height)
  
  if (currentTool.value === 'arrow') {
    drawArrow(x, y, x, y)
  } else if (currentTool.value === 'rect') {
    drawRect(x, y, 0, 0)
  } else if (currentTool.value === 'circle') {
    drawCircle(x, y, 0)
  }
}

const draw = (e) => {
  if (!isDrawing.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (currentTool.value === 'draw' || currentTool.value === 'highlight' || currentTool.value === 'mosaic') {
    currentPath.value.push({ x, y })
    
    if (currentTool.value === 'mosaic') {
      applyMosaic(x, y)
    } else {
      drawPath()
    }
  } else if (currentTool.value === 'arrow') {
    tempCtx.clearRect(0, 0, tempCanvasRef.value.width, tempCanvasRef.value.height)
    const start = currentPath.value[0]
    drawArrow(start.x, start.y, x, y)
  } else if (currentTool.value === 'rect') {
    tempCtx.clearRect(0, 0, tempCanvasRef.value.width, tempCanvasRef.value.height)
    const start = currentPath.value[0]
    drawRect(start.x, start.y, x - start.x, y - start.y)
  } else if (currentTool.value === 'circle') {
    tempCtx.clearRect(0, 0, tempCanvasRef.value.width, tempCanvasRef.value.height)
    const start = currentPath.value[0]
    const radius = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2))
    drawCircle(start.x, start.y, radius)
  }
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  
  isDrawing.value = false
  
  // 将临时画布的内容合并到主画布
  ctx.drawImage(tempCanvasRef.value, 0, 0)
  tempCtx.clearRect(0, 0, tempCanvasRef.value.width, tempCanvasRef.value.height)
  
  // 保存当前状态到历史
  if (currentPath.value.length > 1 || currentTool.value !== 'draw') {
    saveToHistory()
  }
  
  currentPath.value = []
}

// 触摸事件支持
const startDrawingTouch = (e) => {
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  startDrawing(mouseEvent)
}

const drawTouch = (e) => {
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  draw(mouseEvent)
}

const drawPath = () => {
  if (currentPath.value.length < 2) return
  
  tempCtx.clearRect(0, 0, tempCanvasRef.value.width, tempCanvasRef.value.height)
  tempCtx.beginPath()
  tempCtx.moveTo(currentPath.value[0].x, currentPath.value[0].y)
  
  for (let i = 1; i < currentPath.value.length; i++) {
    const point = currentPath.value[i]
    
    if (currentTool.value === 'highlight') {
      tempCtx.strokeStyle = selectedColor.value + '40'
      tempCtx.lineWidth = strokeWidth.value * 3
      tempCtx.globalAlpha = 0.4
    } else {
      tempCtx.strokeStyle = selectedColor.value
      tempCtx.lineWidth = strokeWidth.value
      tempCtx.globalAlpha = 1
    }
    
    tempCtx.lineTo(point.x, point.y)
    tempCtx.stroke()
    tempCtx.beginPath()
    tempCtx.moveTo(point.x, point.y)
  }
}

const drawArrow = (fromX, fromY, toX, toY) => {
  const headLength = 15
  const angle = Math.atan2(toY - fromY, toX - fromX)
  
  tempCtx.strokeStyle = selectedColor.value
  tempCtx.fillStyle = selectedColor.value
  tempCtx.lineWidth = strokeWidth.value
  
  // 主线
  tempCtx.beginPath()
  tempCtx.moveTo(fromX, fromY)
  tempCtx.lineTo(toX, toY)
  tempCtx.stroke()
  
  // 箭头
  tempCtx.beginPath()
  tempCtx.moveTo(toX, toY)
  tempCtx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  )
  tempCtx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  )
  tempCtx.closePath()
  tempCtx.fill()
}

const drawRect = (x, y, width, height) => {
  tempCtx.strokeStyle = selectedColor.value
  tempCtx.lineWidth = strokeWidth.value
  tempCtx.strokeRect(x, y, width, height)
}

const drawCircle = (x, y, radius) => {
  tempCtx.strokeStyle = selectedColor.value
  tempCtx.lineWidth = strokeWidth.value
  tempCtx.beginPath()
  tempCtx.arc(x, y, radius, 0, Math.PI * 2)
  tempCtx.stroke()
}

const applyMosaic = (x, y) => {
  const size = mosaicIntensity.value
  const imageData = ctx.getImageData(
    Math.max(0, x - size / 2),
    Math.max(0, y - size / 2),
    size,
    size
  )
  
  // 简单的马赛克效果
  for (let i = 0; i < imageData.data.length; i += 4 * size) {
    const r = imageData.data[i]
    const g = imageData.data[i + 1]
    const b = imageData.data[i + 2]
    
    for (let j = 0; j < 4 * size && i + j < imageData.data.length; j += 4) {
      imageData.data[i + j] = r
      imageData.data[i + j + 1] = g
      imageData.data[i + j + 2] = b
    }
  }
  
  ctx.putImageData(imageData, Math.max(0, x - size / 2), Math.max(0, y - size / 2))
}

const saveToHistory = () => {
  history.value.push(canvasRef.value.toDataURL())
  if (history.value.length > 20) {
    history.value.shift()
  }
  redoHistory.value = []
}

const undo = () => {
  if (history.value.length === 0) return
  
  redoHistory.value.push(canvasRef.value.toDataURL())
  const lastState = history.value.pop()
  
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.drawImage(img, 0, 0)
  }
  img.src = lastState
}

const redo = () => {
  if (redoHistory.value.length === 0) return
  
  history.value.push(canvasRef.value.toDataURL())
  const nextState = redoHistory.value.pop()
  
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.drawImage(img, 0, 0)
  }
  img.src = nextState
}

const clearCanvas = () => {
  if (confirm('确定要清除所有标注吗？')) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    if (baseCtx) {
      ctx.drawImage(baseCtx.canvas, 0, 0, canvasRef.value.width, canvasRef.value.height)
    }
    saveToHistory()
  }
}

const uploadImage = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      loadBaseImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const resetImage = () => {
  if (confirm('确定要重新开始吗？当前标注将被清除。')) {
    layers.value = []
    history.value = []
    redoHistory.value = []
    if (baseCtx) {
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
      ctx.drawImage(baseCtx.canvas, 0, 0, canvasRef.value.width, canvasRef.value.height)
    }
  }
}

const saveAnnotation = () => {
  const link = document.createElement('a')
  link.download = `annotated-${Date.now()}.png`
  link.href = canvasRef.value.toDataURL('image/png')
  link.click()
}

const getLayerIcon = (type) => {
  const icons = {
    draw: '✏️',
    highlight: '🖍️',
    arrow: '➡️',
    rect: '⬜',
    circle: '⭕',
    mosaic: '🔲',
    text: '📝'
  }
  return icons[type] || '📌'
}

const toggleLayer = (layer) => {
  layer.hidden = !layer.hidden
}

const deleteLayer = (layer) => {
  const index = layers.value.findIndex(l => l.id === layer.id)
  if (index !== -1) {
    layers.value.splice(index, 1)
  }
}

const clearAllLayers = () => {
  if (confirm('确定要清除所有图层吗？')) {
    layers.value = []
    clearCanvas()
  }
}

onMounted(() => {
  if (route.query.image) {
    loadBaseImage(route.query.image)
  } else {
    // 加载默认图片
    loadBaseImage('data:image/svg+xml,' + encodeURIComponent(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="400" y="300" font-family="Arial" font-size="24" fill="#b8b8d1" text-anchor="middle">
          点击"上传图片"开始标注
        </text>
      </svg>
    `))
  }
})
</script>

<style scoped>
.annotator-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.page-header p {
  color: var(--text-secondary);
}

.annotator-content {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  gap: 24px;
}

@media (max-width: 1200px) {
  .annotator-content {
    grid-template-columns: 1fr;
  }
}

.toolbar-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-group-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tool-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.tool-btn.active {
  background: var(--accent);
  border-color: var(--accent);
}

.tool-icon {
  font-size: 20px;
}

.tool-name {
  font-size: 11px;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.width-slider {
  width: 100%;
  accent-color: var(--accent);
}

.width-value {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.tool-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-actions .btn {
  width: 100%;
}

.canvas-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-wrapper {
  position: relative;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  overflow: hidden;
}

canvas {
  max-width: 100%;
  cursor: crosshair;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.temp-canvas {
  position: absolute;
  top: 20px;
  left: 20px;
  pointer-events: none;
}

.canvas-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.layers-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
  height: fit-content;
}

.layers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.layers-header h3 {
  font-size: 16px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.layers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.layer-item:hover {
  background: var(--bg-primary);
}

.layer-item.visible {
  opacity: 1;
}

.layer-item:not(.visible) {
  opacity: 0.5;
}

.layer-icon {
  font-size: 16px;
}

.layer-name {
  flex: 1;
  font-size: 13px;
}

.layer-delete {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
}

.layer-delete:hover {
  background: var(--accent);
  color: white;
}

.empty-layers {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
