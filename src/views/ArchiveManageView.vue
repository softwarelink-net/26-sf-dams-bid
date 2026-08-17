<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="kicker">Collect · Manage · Store · Use</p>
        <h2 class="brand-serif text-2xl mt-1">档案收管存用</h2>
      </div>
      <button class="btn-signal" type="button" @click="showIngest = !showIngest">登记入库</button>
    </div>

    <form v-if="showIngest" class="panel p-4 grid grid-cols-1 md:grid-cols-3 gap-3" @submit.prevent="ingest">
      <input v-model="form.title" required class="border border-slate-700 bg-black/20 px-3 py-2 text-sm" placeholder="题名" />
      <select v-model="form.category" class="border border-slate-700 bg-black/20 px-3 py-2 text-sm">
        <option>研发图纸</option>
        <option>工艺规程</option>
        <option>质量试验</option>
        <option>企业综合</option>
        <option>设备档案</option>
      </select>
      <select v-model="form.security_class" class="border border-slate-700 bg-black/20 px-3 py-2 text-sm">
        <option>公开</option>
        <option>内部</option>
        <option>秘密</option>
        <option>机密</option>
      </select>
      <select v-model="form.file_format" class="border border-slate-700 bg-black/20 px-3 py-2 text-sm">
        <option>OFD</option>
        <option>PDF/A</option>
        <option>DWG</option>
        <option>CATPart</option>
      </select>
      <select v-model="form.retention_period" class="border border-slate-700 bg-black/20 px-3 py-2 text-sm">
        <option>10年</option>
        <option>30年</option>
        <option>永久</option>
      </select>
      <button class="btn-ghost" type="submit">提交并进入四性检测队列</button>
    </form>

    <div class="flex flex-wrap gap-2 text-xs">
      <button
        v-for="c in filters"
        :key="c"
        type="button"
        class="border px-2 py-1"
        :class="filter === c ? 'border-hangar-signal text-white' : 'border-slate-700 text-slate-400'"
        @click="filter = c"
      >
        {{ c }}
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-[11px] text-slate-500 border-b border-slate-800">
          <tr>
            <th class="py-2 text-left">档号</th>
            <th class="py-2 text-left">题名</th>
            <th class="py-2 text-left">门类</th>
            <th class="py-2 text-left">密级</th>
            <th class="py-2 text-left">格式</th>
            <th class="py-2 text-left">四性</th>
            <th class="py-2 text-left">作业</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visible" :key="row.id" class="border-b border-slate-800/70">
            <td class="py-3 font-mono text-xs whitespace-nowrap">{{ row.archive_code }}</td>
            <td class="py-3 pr-4 max-w-sm">{{ row.title }}</td>
            <td class="py-3">{{ row.category }}</td>
            <td class="py-3"><ClassifiedBadge :level="row.security_class" /></td>
            <td class="py-3 font-mono text-xs">{{ row.file_format }}</td>
            <td class="py-3 font-mono text-xs">{{ row.four_check_status }}</td>
            <td class="py-3 whitespace-nowrap space-x-2">
              <RouterLink :to="`/archives/${row.id}`" class="text-hangar-signal text-xs">调阅</RouterLink>
              <button class="text-amber-300 text-xs" type="button" @click="runCheck(row)">四性检测</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FourCheckPipeline v-if="steps.length" :steps="steps" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/stores/api'
import ClassifiedBadge from '@/components/ClassifiedBadge.vue'
import FourCheckPipeline from '@/components/FourCheckPipeline.vue'

const archives = ref([])
const filter = ref('全部')
const showIngest = ref(false)
const steps = ref([])
const form = ref({
  title: '',
  category: '研发图纸',
  security_class: '内部',
  file_format: 'OFD',
  retention_period: '30年',
})

const filters = ['全部', '研发图纸', '工艺规程', '质量试验', '企业综合', '设备档案']

const visible = computed(() =>
  filter.value === '全部' ? archives.value : archives.value.filter((a) => a.category === filter.value),
)

async function load() {
  const data = await api.archives()
  archives.value = data.archives || []
}

async function ingest() {
  await api.ingest({ ...form.value })
  form.value.title = ''
  showIngest.value = false
  await load()
}

async function runCheck(row) {
  const catalog = [
    { key: 'authenticity', name: '真实性', desc: '校验来源签章、档号唯一性与归档员身份绑定' },
    { key: 'integrity', name: '完整性', desc: '对照 SHA-256 与 R2 对象摘要，阻断位翻转与缺页' },
    { key: 'usability', name: '可用性', desc: 'OFD/PDF/A/DWG 轻量化预览与元数据抽取探测' },
    { key: 'security', name: '安全性', desc: '密级标签、ACL 与动态水印策略注入检查' },
  ]
  steps.value = catalog.map((s) => ({ ...s, state: 'wait' }))
  const result = await api.fourCheck(row.id)
  for (let i = 0; i < catalog.length; i++) {
    steps.value[i].state = 'run'
    await new Promise((r) => setTimeout(r, 420))
    const remote = result.steps?.[i]
    steps.value[i].state = remote?.result === 'FAILED' ? 'fail' : 'pass'
    steps.value[i].evidence = remote?.evidence || ''
  }
  await load()
}

onMounted(load)
</script>
