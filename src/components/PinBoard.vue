<template>
  <div class="pinboard">
    <h2>📌 Pin 板</h2>
    
    <div class="toolbar">
      <button @click="addPin">➕ 添加 Pin</button>
      <button @click="clearAll" class="danger">🗑️ 清除全部</button>
      <label class="upload-btn">
        📁 上传图片
        <input type="file" accept="image/*" @change="uploadImage" hidden />
      </label>
    </div>

    <div class="pins-container" ref="container">
      <div 
        v-for="pin in pins" 
        :key="pin.id"
        class="pin"
        :style="{ left: (pin.x || 100) + 'px', top: (pin.y || 100) + 'px' }"
        @mousedown="startDrag(pin, $event)"
      >
        <img :src="pin.image" :alt="`Pin ${pin.id}`" draggable="false" />
        <button class="close" @click.stop="removePin(pin.id)">×</button>
        <div class="resize-handle" @mousedown.stop="startResize(pin, $event)"></div>
      </div>
      
      <div v-if="pins.length === 0" class="empty">
        <p>还没有 Pin</p>
        <p class="hint">截图后点击"Pin到屏幕"或上传图片</p>
      </div>
    </div>

    <div class="instructions">
      <p>💡 提示：拖拽移动位置，右下角调整大小</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const pins = ref([])
const container = ref(null)
let draggingPin = null
let resizingPin = null
let dragOffset = { x: 0, y: 0 }
let startPos = { x: 0, y: 0 }

const loadPins = () => {
  try {
    pins.value = JSON.parse(localStorage.getItem('pixpin-pins') || '[]')
  } catch (e) {
    pins.value = []
  }
}

const savePins = () => {
  localStorage.setItem('pixpin-pins', JSON.stringify(pins.value))
}

const addPin = () => {
  const pendingImage = localStorage.getItem('pendingImage')
  const baseX = 100 + (pins.value.length % 5) * 50
  const baseY = 100 + Math.floor(pins.value.length / 5) * 50
  
  if (pendingImage) {
    pins.value.push({ 
      id: Date.now(), 
      image: pendingImage, 
      x: baseX, 
      y: baseY 
    })
    localStorage.removeItem('pendingImage')
  } else {
    pins.value.push({ 
      id: Date.now(), 
      image: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="#21262d" width="200" height="150"/><text fill="#8b949e" x="50%" y="50%" text-anchor="middle" text-anchor="middle">New Pin</text></svg>'),
      x: baseX, 
      y: baseY 
    })
  }
  savePins()
}

const uploadImage = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const baseX = 100 + (pins.value.length % 5) * 50
      const baseY = 100 + Math.floor(pins.value.length / 5) * 50
      pins.value.push({ 
        id: Date.now(), 
        image: ev.target.result, 
        x: baseX, 
        y: baseY 
      })
      savePins()
    }
    reader.readAsDataURL(file)
  }
}

const removePin = (id) => {
  pins.value = pins.value.filter(p => p.id !== id)
  savePins()
}

const clearAll = () => {
  if (confirm('清除所有 Pin?')) {
    pins.value = []
    savePins()
  }
}

const startDrag = (pin, e) => {
  draggingPin = pin
  dragOffset = { x: e.clientX - (pin.x || 0), y: e.clientY - (pin.y || 0) }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (draggingPin) {
    draggingPin.x = e.clientX - dragOffset.x
    draggingPin.y = e.clientY - dragOffset.y
    savePins()
  }
}

const stopDrag = () => {
  draggingPin = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const startResize = (pin, e) => {
  resizingPin = pin
  startPos = { x: e.clientX, y: e.clientY }
  const img = e.target.parentElement.querySelector('img')
  const dx = e.clientX - startPos.x
  img.style.width = Math.max(50, (parseInt(img.style.width) || 200) + dx) + 'px'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (e) => {
  if (resizingPin && e.target.parentElement) {
    const dx = e.clientX - startPos.x
    const img = e.target.parentElement.querySelector('img')
    img.style.width = Math.max(50, 200 + dx) + 'px'
  }
}

const stopResize = () => {
  resizingPin = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(loadPins)
</script>

<style scoped>
.pinboard { padding: 20px; position: relative; min-height: 500px; }
h2 { margin-bottom: 20px; color: #f0f6fc; }
.toolbar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.toolbar button, .upload-btn {
  padding: 10px 20px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 8px;
  color: #c9d1d9;
  cursor: pointer;
}
.toolbar button:hover, .upload-btn:hover { background: #1f6feb; border-color: #1f6feb; color: white; }
.toolbar button.danger { background: #da3633; }
.pins-container { position: relative; min-height: 400px; }
.pin {
  position: absolute;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  cursor: move;
  overflow: hidden;
}
.pin img { display: block; max-width: 200px; height: auto; }
.pin .close {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.6);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
}
.pin .resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 50%, #1f6feb 50%);
  border-radius: 0 0 8px 0;
}
.empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #8b949e;
}
.empty .hint { font-size: 12px; margin-top: 8px; color: #58a6ff; }
.instructions { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); color: #8b949e; font-size: 13px; }
</style>
