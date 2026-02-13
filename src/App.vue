<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useBingoState } from '@/composables/useBingoState'

const route = useRoute()
const { activeGameMode, gameModes, setGameMode } = useBingoState()

async function share() {
  const text = '¡Juega al bingo gratis con esta herramienta! 🎱'
  const url = 'https://bingoo.app'
  if (navigator.share) {
    await navigator.share({ title: 'Bingoo', text, url })
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
  }
}
</script>

<template>
  <div class="mx-auto max-w-[900px] p-2 sm:p-4 font-[Inter,system-ui,sans-serif]">
    <header class="mb-6 text-center">
      <div class="relative mb-3 flex items-center justify-center">
        <h1 class="text-4xl font-black tracking-[0.3em] sm:text-5xl">
          <router-link
            to="/"
            class="bg-gradient-to-br from-[#e74c3c] via-[#2ecc71] to-[#9b59b6] bg-clip-text text-transparent no-underline"
          >
            BINGO
          </router-link>
        </h1>
        <button
          class="absolute right-0 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
          @click="share"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Compartir
        </button>
      </div>

      <nav class="inline-flex gap-1.5 rounded-xl bg-slate-900 p-1">
        <router-link
          to="/"
          class="rounded-lg px-5 py-2 text-sm font-semibold text-slate-500 transition-all hover:text-slate-300"
          :class="route.name === 'board' && '!bg-slate-800 !text-slate-100'"
        >
          Tablero
        </router-link>
        <router-link
          to="/cartones"
          class="rounded-lg px-5 py-2 text-sm font-semibold text-slate-500 transition-all hover:text-slate-300"
          :class="route.name === 'cards' && '!bg-slate-800 !text-slate-100'"
        >
          Mis Cartones
        </router-link>
        <router-link
          to="/grabar"
          class="rounded-lg px-5 py-2 text-sm font-semibold text-slate-500 transition-all hover:text-slate-300"
          :class="route.name === 'record' && '!bg-slate-800 !text-slate-100'"
        >
          Grabar Audio
        </router-link>
        <router-link
          to="/generar"
          class="rounded-lg px-5 py-2 text-sm font-semibold text-slate-500 transition-all hover:text-slate-300"
          :class="route.name === 'generate' && '!bg-slate-800 !text-slate-100'"
        >
          Generar Cartones
        </router-link>
      </nav>

      <div v-if="route.name !== 'record' && route.name !== 'generate'" class="mt-3.5 flex flex-col items-center gap-1.5">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-600">
          Modo de juego
        </span>
        <div class="inline-flex gap-1 rounded-xl bg-slate-900 p-1">
          <button
            v-for="mode in gameModes"
            :key="mode.id"
            class="flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:text-slate-500"
            :class="activeGameMode === mode.id && '!bg-slate-800 !text-slate-100'"
            @click="setGameMode(mode.id)"
          >
            <span class="text-base">{{ mode.icon }}</span>
            <span class="text-xs">{{ mode.label }}</span>
          </button>
        </div>
      </div>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>
