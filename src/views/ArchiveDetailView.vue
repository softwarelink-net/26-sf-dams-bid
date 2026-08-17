<template>
  <div v-if="archive" class="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
    <section class="relative min-h-[420px] overflow-hidden border border-slate-800">
      <img :src="hero" alt="" class="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div class="absolute inset-0 bg-[#0b1329]/55" />
      <div class="relative z-10 p-6 md:p-8 h-full flex flex-col justify-end">
        <ClassifiedBadge :level="archive.security_class" />
        <h2 class="brand-serif text-2xl md:text-3xl mt-4 max-w-2xl">{{ archive.title }}</h2>
        <p class="mt-3 font-mono text-xs text-slate-300">
          {{ archive.archive_code }} · {{ archive.file_format }} · SHA-256 {{ archive.sha256_hash.slice(0, 16) }}…
        </p>
        <p class="mt-6 text-xs text-amber-200/80">屏幕已叠加操作员动态防伪水印，禁止拍照外传。</p>
      </div>
    </section>

    <section class="space-y-5">
      <dl class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-slate-500">门类</dt>
          <dd>{{ archive.category }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">保管期限</dt>
          <dd>{{ archive.retention_period }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">四性状态</dt>
          <dd class="font-mono">{{ archive.four_check_status }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">对象键</dt>
          <dd class="font-mono text-xs break-all">{{ archive.r2_object_key }}</dd>
        </div>
      </dl>

      <div v-if="auth.role === 'sec_admin'" class="panel p-4">
        <p class="text-xs text-slate-400 mb-2">定密调整</p>
        <div class="flex gap-2">
          <select v-model="nextClass" class="flex-1 border border-slate-700 bg-black/20 px-3 py-2 text-sm">
            <option>公开</option>
            <option>内部</option>
            <option>秘密</option>
            <option>机密</option>
          </select>
          <button class="btn-signal" type="button" @click="classify">批准</button>
        </div>
      </div>

      <div>
        <p class="text-xs text-slate-500 mb-3">轻量化元数据</p>
        <ul class="text-sm space-y-2 text-slate-300">
          <li>机型域：运-9 / 特种机总装线</li>
          <li>介质：{{ archive.file_format }} · {{ (archive.file_size_bytes / 1048576).toFixed(1) }} MB</li>
          <li>水印：{{ auth.user?.username }} · {{ auth.clientIp }}</li>
        </ul>
      </div>
    </section>
  </div>
  <p v-else class="text-slate-500">正在载入受控预览…</p>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import ClassifiedBadge from '@/components/ClassifiedBadge.vue'
import hero from '@/assets/hangar-hero.png'

const route = useRoute()
const auth = useAuthStore()
const archive = ref(null)
const nextClass = ref('内部')

async function load() {
  const data = await api.archive(route.params.id)
  archive.value = data.archive
  nextClass.value = data.archive.security_class
}

async function classify() {
  await api.classify({ archive_id: archive.value.id, security_class: nextClass.value })
  await load()
}

onMounted(load)
</script>
