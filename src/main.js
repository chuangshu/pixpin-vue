import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Screenshot from './components/Screenshot.vue'
import PinBoard from './components/PinBoard.vue'
import OCR from './components/OCR.vue'
import Annotator from './components/Annotator.vue'

const routes = [
  { path: '/', redirect: '/screenshot' },
  { path: '/screenshot', component: Screenshot },
  { path: '/pin', component: PinBoard },
  { path: '/ocr', component: OCR },
  { path: '/annotator', component: Annotator }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
