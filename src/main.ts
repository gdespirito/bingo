import { createApp } from 'vue'
import { createUnhead, headSymbol } from '@unhead/vue'
import kilden from 'kilden'
import App from './App.vue'
import router from './router'
import './style.css'

kilden.init('wk_TAh2R6ZhOHjv1Brztzbo4pNj6d3OB4R0pq5tLeS2', {
  autocapture: true,
  sessionRecording: true,
})

const app = createApp(App)
const head = createUnhead()

app.use(router)
app.provide(headSymbol, head)

app.mount('#app')
