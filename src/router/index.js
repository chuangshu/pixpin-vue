import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Screenshot',
    component: () => import('../components/Screenshot.vue')
  },
  {
    path: '/pinboard',
    name: 'PinBoard',
    component: () => import('../components/PinBoard.vue')
  },
  {
    path: '/ocr',
    name: 'OCR',
    component: () => import('../components/OCR.vue')
  },
  {
    path: '/annotator',
    name: 'Annotator',
    component: () => import('../components/Annotator.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
