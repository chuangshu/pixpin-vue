<template>
  <div class="ocr-container">
    <div class="page-header">
      <h1>🔍 OCR 文字识别</h1>
      <p>从图片中提取文字内容</p>
    </div>
    
    <div class="ocr-content">
      <div class="image-section">
        <div 
          class="upload-area" 
          @click="triggerUpload"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <input 
            type="file" 
            ref="fileInputRef"
            accept="image/*" 
            @change="handleFileSelect"
            hidden
          />
          <div v-if="!previewImage" class="upload-placeholder">
            <span class="upload-icon">📁</span>
            <p>点击或拖拽图片到这里</p>
            <p class="upload-hint">支持 PNG、JPG、GIF</p>
          </div>
          <div v-else class="preview-wrapper">
            <img :src="previewImage" alt="预览" class="preview-image" />
            <button class="change-btn" @click.stop="triggerUpload">更换图片</button>
          </div>
        </div>
        
        <div class="language-select">
          <label>识别语言：</label>
          <select v-model="selectedLanguage" class="input">
            <option value="eng">English</option>
            <option value="chi_sim">简体中文</option>
            <option value="chi_tra">繁體中文</option>
            <option value="jpn">日本語</option>
            <option value="kor">한국어</option>
            <option value="deu">Deutsch</option>
            <option value="fra">Français</option>
            <option value="spa">Español</option>
          </select>
        </div>
        
        <button 
          class="btn btn-primary start-btn" 
          @click="startOCR"
          :disabled="!previewImage || isProcessing"
        >
          {{ isProcessing ? '识别中...' : '🚀 开始识别' }}
        </button>
        
        <div class="progress-bar" v-if="isProcessing">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <span class="progress-text">{{ progressMessage }}</span>
        </div>
      </div>
      
      <div class="result-section">
        <div class="result-header">
          <h3>识别结果</h3>
          <div class="result-actions" v-if="ocrResult">
            <button class="btn btn-secondary btn-sm" @click="copyResult">
              📋 复制
            </button>
            <button class="btn btn-secondary btn-sm" @click="downloadResult">
              💾 保存
            </button>
          </div>
        </div>
        
        <div class="result-content">
          <div v-if="!ocrResult && !isProcessing" class="empty-result">
            <span class="empty-icon">📝</span>
            <p>上传图片后开始识别</p>
          </div>
          
          <div v-else-if="ocrResult" class="result-text">
            <textarea 
              ref="resultTextarea"
              v-model="ocrResult"
              class="result-input"
              placeholder="识别结果将显示在这里..."
            ></textarea>
            <div class="word-count">
              {{ ocrResult.length }} 个字符，{{ ocrResult.split(/\s+/).filter(w => w).length }} 个单词
            </div>
          </div>
          
          <div v-else-if="isProcessing" class="processing">
            <div class="spinner"></div>
            <p>正在分析图片...</p>
          </div>
        </div>
        
        <div class="result-tips" v-if="ocrResult">
          <p>💡 提示：识别结果可能包含错误，请仔细核对</p>
        </div>
      </div>
    </div>
    
    <div class="history-section" v-if="history.length > 0">
      <div class="history-header">
        <h3>📜 识别历史</h3>
        <button class="btn btn-secondary btn-sm" @click="clearHistory">
          清除历史
        </button>
      </div>
      <div class="history-list">
        <div 
          v-for="(item, index) in history" 
          :key="index"
          class="history-item"
          @click="loadHistory(item)"
        >
          <img :src="item.image" :alt="'历史' + (index + 1)" class="history-thumb" />
          <div class="history-info">
            <span class="history-date">{{ formatDate(item.date) }}</span>
            <span class="history-preview">{{ item.text.substring(0, 50) }}...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Tesseract from 'tesseract.js'

const route = useRoute()
const fileInputRef = ref(null)
const resultTextarea = ref(null)

const previewImage = ref(null)
const selectedLanguage = ref('chi_sim')
const isProcessing = ref(false)
const progress = ref(0)
const progressMessage = ref('')
const ocrResult = ref('')
const history = ref([])

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    loadImage(file)
  }
}

const loadImage = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
    ocrResult.value = ''
  }
  reader.readAsDataURL(file)
}

const startOCR = async () => {
  if (!previewImage.value) return
  
  isProcessing.value = true
  progress.value = 0
  progressMessage.value = '正在初始化...'
  
  try {
    const worker = await Tesseract.createWorker(selectedLanguage.value, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          progress.value = Math.round(m.progress * 100)
          progressMessage.value = '正在识别文字...'
        } else {
          progressMessage.value = m.status
        }
      }
    })
    
    const { data: { text } } = await worker.recognize(previewImage.value)
    
    ocrResult.value = text.trim()
    
    // 保存到历史
    saveToHistory(text.trim())
    
    await worker.terminate()
  } catch (error) {
    console.error('OCR识别失败:', error)
    alert('识别失败，请重试')
  } finally {
    isProcessing.value = false
    progress.value = 100
    progressMessage.value = '识别完成'
  }
}

const saveToHistory = (text) => {
  const newItem = {
    image: previewImage.value,
    text,
    date: new Date().toISOString()
  }
  
  history.value.unshift(newItem)
  
  // 最多保留10条
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }
  
  // 保存到 localStorage
  try {
    localStorage.setItem('ocr-history', JSON.stringify(history.value))
  } catch (e) {
    console.error('保存历史失败:', e)
  }
}

const loadHistory = (item) => {
  previewImage.value = item.image
  ocrResult.value = item.text
}

const clearHistory = () => {
  if (confirm('确定要清除所有历史记录吗？')) {
    history.value = []
    localStorage.removeItem('ocr-history')
  }
}

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(ocrResult.value)
    alert('已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textarea = resultTextarea.value
    textarea.select()
    document.execCommand('copy')
    alert('已复制到剪贴板')
  }
}

const downloadResult = () => {
  const blob = new Blob([ocrResult.value], { type: 'text/plain' })
  const link = document.createElement('a')
  link.download = `ocr-result-${Date.now()}.txt`
  link.href = URL.createObjectURL(blob)
  link.click()
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 从URL参数加载图片
onMounted(() => {
  try {
    const savedHistory = localStorage.getItem('ocr-history')
    if (savedHistory) {
      history.value = JSON.parse(savedHistory)
    }
    
    if (route.query.image) {
      previewImage.value = route.query.image
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  }
})
</script>

<style scoped>
.ocr-container {
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

.ocr-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .ocr-content {
    grid-template-columns: 1fr;
  }
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--accent);
  background: rgba(233, 69, 96, 0.05);
}

.upload-placeholder {
  color: var(--text-secondary);
}

.upload-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.upload-hint {
  font-size: 12px;
  margin-top: 8px;
}

.preview-wrapper {
  position: relative;
  width: 100%;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
}

.change-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.language-select {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-select label {
  white-space: nowrap;
}

.start-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
}

.progress-bar {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 8px;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.result-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.result-header h3 {
  font-size: 18px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.result-content {
  flex: 1;
  min-height: 300px;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.result-text {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.result-input {
  flex: 1;
  min-height: 280px;
  padding: 16px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}

.result-input:focus {
  border-color: var(--accent);
}

.word-count {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-secondary);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-tips {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.result-tips p {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.history-header h3 {
  font-size: 18px;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.history-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.history-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-preview {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
