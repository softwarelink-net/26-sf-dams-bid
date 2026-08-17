<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none fixed left-0 right-0 bottom-0 z-[80]"
    :style="{ top: '40px', opacity: 0.14 }"
    aria-hidden="true"
  />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  userCode: { type: String, default: 'GUEST' },
  role: { type: String, default: '—' },
  clientIp: { type: String, default: '0.0.0.0' },
  classified: { type: String, default: '内部' },
})

const canvasRef = ref(null)
let timer = 0
let raf = 0
let stamp = ''

function buildStamp() {
  const ts = new Date().toLocaleString('zh-CN', { hour12: false })
  stamp = `${props.userCode}  ${props.role}  ${props.clientIp}  ${props.classified}  ${ts}`
}

function draw(offset = 0) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.55)'
  ctx.font = '12px "IBM Plex Mono", monospace'
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate((-22 * Math.PI) / 180)
  const gapX = 280
  const gapY = 88
  for (let y = -h; y < h; y += gapY) {
    for (let x = -w; x < w; x += gapX) {
      ctx.fillText(stamp, x + (offset % gapX), y)
    }
  }
  ctx.restore()
}

function tick() {
  buildStamp()
  draw(Date.now() / 40)
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  buildStamp()
  tick()
  timer = window.setInterval(buildStamp, 1000)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearInterval(timer)
})

watch(() => [props.userCode, props.role, props.clientIp, props.classified], buildStamp)
</script>
