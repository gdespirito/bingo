import { createRouter, createWebHistory } from 'vue-router'
import BoardView from '@/views/BoardView.vue'
import CardsView from '@/views/CardsView.vue'
import RecordView from '@/views/RecordView.vue'
import GenerateView from '@/views/GenerateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'board',
      component: BoardView,
    },
    {
      path: '/cartones',
      name: 'cards',
      component: CardsView,
    },
    {
      path: '/grabar',
      name: 'record',
      component: RecordView,
    },
    {
      path: '/generar',
      name: 'generate',
      component: GenerateView,
    },
  ],
})

export default router
