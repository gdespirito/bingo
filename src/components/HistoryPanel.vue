<script setup lang="ts">
import { useBingoState } from '@/composables/useBingoState'

defineProps<{ history: number[] }>()

const { getLetterForNumber, getColorForNumber } = useBingoState()
</script>

<template>
  <div class="w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-3 sm:w-[130px] sm:shrink-0 sm:max-h-[70vh]">
    <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      Historial <span class="text-slate-600">({{ history.length }})</span>
    </h3>
    <div v-if="history.length > 0" class="flex flex-row flex-wrap gap-1 sm:flex-col">
      <div
        v-for="(num, idx) in [...history].reverse()"
        :key="idx"
        class="flex items-center gap-1.5"
        :class="idx === 0 && 'animate-[pop-in_0.3s_ease]'"
      >
        <span class="hidden min-w-[18px] text-right text-[0.65rem] font-semibold text-slate-700 sm:inline">{{ history.length - idx }}</span>
        <span
          class="flex-1 rounded-md px-2 py-0.5 text-center text-xs font-bold text-white"
          :style="{ background: getColorForNumber(num) }"
        >
          {{ getLetterForNumber(num) }}-{{ num }}
        </span>
      </div>
    </div>
    <div v-else class="py-3 text-center text-xs text-slate-700">Sin números aún</div>
  </div>
</template>
