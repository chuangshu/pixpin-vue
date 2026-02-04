<template>
  <div class="screenshot-page slide-up">
    <div class="page-header">
      <h1>Screenshot</h1>
      <p class="text-muted">Capture screenshots of any element on the page</p>
    </div>

    <div class="features-grid grid grid-4">
      <div class="feature-card card" @click="captureFullPage">
        <div class="feature-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M9 21V9"/>
          </svg>
        </div>
        <h3>Full Page</h3>
        <p class="text-muted">Capture entire page</p>
      </div>

      <div class="feature-card card" @click="selectElement">
        <div class="feature-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4l16 16"/>
            <path d="M12 12l6-6"/>
            <path d="M12 12l-6 6"/>
          </svg>
        </div>
        <h3>Select Element</h3>
        <p class="text-muted">Click to capture specific element</p>
      </div>

      <div class="feature-card card" @click="startLongScreenshot">
        <div class="feature-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16"/>
            <path d="M4 12h16"/>
            <path d="M4 18h16"/>
            <path d="M12 6v12"/>
          </svg>
        </div>
        <h3>Long Screenshot</h3>
        <p class="text-muted">Stitch multiple captures</p>
      </div>

      <div class="feature-card card" @click="openClipboard">
        <div class="feature-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
        </div>
        <h3>From Clipboard</h3>
        <p class="text-muted">Paste from clipboard</p>
      </div>
    </div>

    <div v-if="capturedImage" class="result-section card mt-3">
      <div class="result-header flex-between">
        <h3>Captured Image</h3>
        <div class="action-buttons flex gap-1">
          <button class="btn btn-secondary" @click="downloadImage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
          <button class="btn btn-primary" @click="pinToBoard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
            Pin to Board
          </button>
          <button class="btn btn-secondary" @click="copyToClipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
        </div>
      </div>
      <div class="preview-container mt-2">
        <img :src="capturedImage" alt="Captured screenshot" class="preview-image" />
      </div>
    </div>

    <div v-if="isSelecting" class="selection-overlay" @click="cancelSelection">
      <div class="selection-hint">
        <p>Click on any element to capture it</p>
        <button class="btn btn-secondary mt-2" @click.stop="cancelSelection">Cancel</button>
      </div>
    </div>

    <div v-if="isLongScreenshot" class="long-screenshot-panel card mt-3">
      <h3>Long Screenshot</h3>
      <p class="text-muted mt-1">Scroll down and capture sections to stitch them together</p>
      <div class="long-screenshot-controls mt-2 flex gap-1">
        <button class="btn btn-primary" @click="addSection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Current Section
        </button>
        <button class="btn btn-secondary" @click="finishLongScreenshot" :disabled="sections.length < 2">
          Finish & Stitch
        </button>
        <button class="btn btn-danger" @click="cancelLongScreenshot">Cancel</button>
      </div>
      <div v-if="sections.length > 0" class="sections-preview mt-2">
        <p class="mb-1">Captured sections: {{ sections.length }}</p>
        <div class="sections-grid flex gap-1">
          <div v-for="(section, index) in sections" :key="index" class="section-thumb">
            <img :src="section" :alt="'Section ' + (index + 1)" />
            <span>{{ index + 1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import html2canvas from 'html2canvas'
import { useRouter } from 'vue-router'

const router = useRouter()

const capturedImage = ref(null)
const isSelecting = ref(false)
const isLongScreenshot = ref(false)
const sections = ref([])

const captureFullPage = async () => {
  try {
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      logging: false,
      scale: 2
    })
    capturedImage.value = canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Screenshot failed:', error)
    alert('Failed to capture screenshot. Please try again.')
  }
}

const selectElement = () => {
  isSelecting.value = true
  document.body.style.cursor = 'crosshair'
}

const handleElementClick = async (event) => {
  if (!isSelecting.value) return
  
  try {
    const canvas = await html2canvas(event.target, {
      useCORS: true,
      logging: false,
      scale: 2
    })
    capturedImage.value = canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Element capture failed:', error)
    alert('Failed to capture element. Please try again.')
  } finally {
    cancelSelection()
  }
}

const cancelSelection = () => {
  isSelecting.value = false
  document.body.style.cursor = 'default'
}

const startLongScreenshot = () => {
  isLongScreenshot.value = true
  sections.value = []
}

const addSection = async () => {
  try {
    const canvas = await html2canvas(document.documentElement, {
      useCORS: true,
      logging: false,
      scale: 2
    })
    sections.value.push(canvas.toDataURL('image/png'))
  } catch (error) {
    console.error('Section capture failed:', error)
  }
}

const finishLongScreenshot = async () => {
  if (sections.value.length < 2) return
  
  const stitchCanvas = document.createElement('canvas')
  const ctx = stitchCanvas.getContext('2d')
  const firstImg = await loadImage(sections.value[0])
  
  stitchCanvas.width = firstImg.width
  stitchCanvas.height = firstImg.height * sections.value.length
  
  let yOffset = 0
  for (const sectionData of sections.value) {
    const img = await loadImage(sectionData)
    ctx.drawImage(img, 0, yOffset)
    yOffset += img.height
  }
  
  capturedImage.value = stitchCanvas.toDataURL('image/png')
  cancelLongScreenshot()
}

const cancelLongScreenshot = () => {
  isLongScreenshot.value = false
  sections.value = []
}

const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

const downloadImage = () => {
  if (!capturedImage.value) return
  
  const link = document.createElement('a')
  link.download = `screenshot-${Date.now()}.png`
  link.href = capturedImage.value
  link.click()
}

const pinToBoard = () => {
  if (!capturedImage.value) return
  
  const pinnedItems = JSON.parse(localStorage.getItem('pinnedItems') || '[]')
  pinnedItems.push({
    id: Date.now(),
    image: capturedImage.value,
    x: 100,
    y: 100,
    width: 300
  })
  localStorage.setItem('pinnedItems', JSON.stringify(pinnedItems))
  
  router.push('/pinboard')
}

const copyToClipboard = async () => {
  if (!capturedImage.value) return
  
  try {
    const response = await fetch(capturedImage.value)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    alert('Copied to clipboard!')
  } catch (error) {
    console.error('Copy failed:', error)
    alert('Failed to copy to clipboard')
  }
}

const openClipboard = async () => {
  try {
    const clipboardItems = await navigator.clipboard.read()
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          capturedImage.value = URL.createObjectURL(blob)
          return
        }
      }
    }
    alert('No image found in clipboard')
  } catch (error) {
    console.error('Clipboard read failed:', error)
    alert('Failed to read from clipboard. Please ensure clipboard permissions are granted.')
  }
}

onMounted(() => {
  document.addEventListener('click', handleElementClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleElementClick)
  cancelSelection()
})
</script>

<style scoped>
.screenshot-page {
  animation: slideUp 0.4s ease;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.features-grid {
  margin-top: 24px;
}

.feature-card {
  cursor: pointer;
  text-align: center;
  padding: 24px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-color);
}

.feature-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-bg);
  border-radius: var(--radius-md);
  color: var(--accent-color);
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.feature-card p {
  font-size: 13px;
}

.result-section {
  animation: fadeIn 0.3s ease;
}

.result-header {
  margin-bottom: 16px;
}

.result-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.preview-container {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 16px;
  overflow: auto;
  max-height: 500px;
}

.preview-image {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-hint {
  text-align: center;
  color: white;
}

.selection-hint p {
  font-size: 18px;
  margin-bottom: 8px;
}

.long-screenshot-panel h3 {
  font-size: 16px;
  font-weight: 600;
}

.sections-preview .section-thumb {
  position: relative;
  width: 80px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.sections-preview .section-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sections-preview .section-thumb span {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
