import { ref, type Ref } from 'vue'
import heic2any from 'heic2any'

function isHeic(file: File): boolean {
  const n = file.name.toLowerCase()
  return file.type === 'image/heic' || file.type === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif')
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })) as Blob
  return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1]!)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

async function callVisionAPI(apiKey: string, base64: string, mimeType: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `This is a photo of a BINGO card. Extract the 5x5 grid of numbers exactly as they appear, row by row from top to bottom.\n\nThe columns are B (1-15), I (16-30), N (31-45), G (46-60), O (61-75).\nThe center cell (row 3, col 3) is always FREE — use 0 for it.\n\nReturn ONLY a JSON array of 5 arrays, each with 5 numbers. No explanation, no markdown, just the JSON.\nExample: [[3,20,36,49,63],[13,16,33,54,70],[7,26,0,57,71],[15,21,42,47,75],[4,19,35,55,68]]` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }],
      max_tokens: 300,
      temperature: 0,
    }),
  })
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    throw new Error(errBody.error?.message || `API error: ${response.status}`)
  }
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Respuesta vacia de la API')
  const jsonStr = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed) || parsed.length !== 5) throw new Error('La respuesta no tiene 5 filas')
  for (const row of parsed) { if (!Array.isArray(row) || row.length !== 5) throw new Error('Cada fila debe tener 5 numeros') }
  return parsed as number[][]
}

export function useCardOcr(
  apiKey: Ref<string>,
  grid: Ref<(number | null)[][]>,
  onApiKeyNeeded: () => void,
) {
  const photoLoading = ref(false)
  const photoError = ref('')
  const fileInput = ref<HTMLInputElement | null>(null)

  function triggerFileUpload() {
    if (!apiKey.value.trim()) { onApiKeyNeeded(); return }
    fileInput.value?.click()
  }

  function applyParsedGrid(parsed: number[][]) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) grid.value[r]![c] = null
        else { const v = parsed[r]![c]!; grid.value[r]![c] = v >= 1 && v <= 75 ? v : null }
      }
    }
    grid.value = grid.value.map((row) => [...row])
  }

  async function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    let file = input.files?.[0]
    if (!file) return
    input.value = ''
    photoError.value = ''
    photoLoading.value = true
    try {
      if (isHeic(file)) file = await convertHeicToJpeg(file)
      const base64 = await fileToBase64(file)
      applyParsedGrid(await callVisionAPI(apiKey.value.trim(), base64, file.type))
    } catch (err: any) {
      photoError.value = err.message || 'Error al procesar la imagen'
    } finally {
      photoLoading.value = false
    }
  }

  return { photoLoading, photoError, fileInput, triggerFileUpload, onFileSelected }
}
