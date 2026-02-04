<template>
  <div class="app-container">
    <nav class="nav-bar">
      <div class="nav-brand">
        <span class="brand-icon">📌</span>
        <span class="brand-text">PixPin Vue</span>
      </div>
      <div class="nav-tabs">
        <router-link 
          v-for="tab in tabs" 
          :key="tab.path"
          :to="tab.path"
          class="nav-tab"
          :class="{ active: $route.path === tab.path }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-text">{{ tab.name }}</span>
        </router-link>
      </div>
      <div class="nav-actions">
        <button class="btn btn-icon" @click="togglePinBoard" title="查看图钉板">
          📌
        </button>
      </div>
    </nav>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <!-- 悬浮图钉显示 -->
    <PinBoard :floating="true" v-if="showFloatingPinBoard" @close="showFloatingPinBoard = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PinBoard from '@/components/PinBoard.vue'

const router = useRouter()
const showFloatingPinBoard = ref(false)

const tabs = [
  { name: '截图', path: '/screenshot', icon: '📸' },
  { name: '图钉', path: '/pin', icon: '📌' },
  { name: 'OCR', path: '/ocr', icon: '🔍' },
  { name: '标注', path: '/annotator', icon: '✏️' }
]

const togglePinBoard = () => {
  showFloatingPinBoard.value = !showFloatingPinBoard.value
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-tab:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-tab.active {
  background: var(--accent);
  color: white;
}

.tab-icon {
  font-size: 16px;
}

.tab-text {
  font-weight: 500;
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .nav-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .nav-tabs {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .tab-text {
    display: none;
  }
}
</style>
