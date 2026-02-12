<script setup lang="ts">
import { ref } from 'vue'

const APIKEY_STORAGE = 'bingo-openai-key'

const visible = defineModel<boolean>({ required: true })
const apiKey = ref(localStorage.getItem(APIKEY_STORAGE) ?? '')

function save() {
  localStorage.setItem(APIKEY_STORAGE, apiKey.value.trim())
  visible.value = false
}

defineExpose({ apiKey })
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
    @click.self="visible = false"
  >
    <div class="w-full max-w-[400px] rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 class="mb-2 text-lg font-extrabold text-slate-300">OpenAI API Key</h3>
      <p class="mb-3.5 text-sm leading-snug text-slate-600">Se necesita para leer fotos de cartones. Se guarda solo en tu navegador.</p>
      <input
        v-model="apiKey"
        type="password"
        placeholder="sk-..."
        class="mb-3.5 w-full rounded-lg border-2 border-slate-800 bg-slate-950 px-3.5 py-2.5 font-semibold text-slate-100 outline-none transition-colors focus:border-blue-600"
        @keyup.enter="save"
      />
      <div class="flex gap-2.5">
        <button class="flex-1 cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700" @click="save">Guardar</button>
        <button class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-950 py-3 font-semibold text-slate-500 transition-all hover:border-slate-700 hover:text-slate-300" @click="visible = false">Cancelar</button>
      </div>
    </div>
  </div>
</template>
