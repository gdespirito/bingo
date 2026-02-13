<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useBingoState } from '@/composables/useBingoState'

const route = useRoute()
const { activeGameMode, gameModes, setGameMode } = useBingoState()
</script>

<template>
  <div class="mx-auto max-w-[900px] p-2 sm:p-4 font-[Inter,system-ui,sans-serif]">
    <header class="mb-6 text-center">
      <h1 class="mb-3 text-4xl font-black tracking-[0.3em] sm:text-5xl">
        <router-link
          to="/"
          class="bg-gradient-to-br from-[#e74c3c] via-[#2ecc71] to-[#9b59b6] bg-clip-text text-transparent no-underline"
        >
          BINGO
        </router-link>
      </h1>

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
