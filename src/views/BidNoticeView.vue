<template>
  <div>
    <section class="relative light-sweep min-h-[calc(100vh-40px)] overflow-hidden">
      <img
        :src="hero"
        alt="陕飞总装厂房与运输机机库"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-[#070b16]/92 via-[#070b16]/55 to-[#070b16]/20" />
      <div class="absolute inset-0 hangar-grid opacity-40 mix-blend-soft-light" />

      <div class="relative z-10 flex min-h-[calc(100vh-40px)] flex-col justify-end px-6 pb-16 pt-24 md:px-16 lg:px-24">
        <p class="brand-serif text-2xl md:text-4xl tracking-wide text-amber-100/95">
          陕西飞机工业有限责任公司
        </p>
        <h1 class="mt-4 max-w-3xl brand-serif text-4xl md:text-6xl leading-tight text-white">
          数字档案管理系统
        </h1>
        <p class="mt-5 max-w-xl text-base md:text-lg text-slate-200/90">
          涉密分级保护 · 信创四节点 · 收管存用全生命周期
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink to="/login" class="btn-signal">进入三员认证</RouterLink>
          <a href="#bid-body" class="btn-ghost">阅读招标公告</a>
        </div>
      </div>
    </section>

    <section id="bid-body" class="px-6 py-16 md:px-16 lg:px-24 bg-[#0b1329]">
      <p class="kicker">0730-2611010525/01</p>
      <h2 class="brand-serif mt-3 text-3xl">数字档案管理系统招标公告</h2>
      <p class="mt-3 max-w-3xl text-slate-400">
        {{ bid?.summary }}
      </p>

      <div class="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-8">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <div>
              <dt class="text-slate-500">项目发包方</dt>
              <dd class="mt-1">陕西飞机工业有限责任公司</dd>
            </div>
            <div>
              <dt class="text-slate-500">项目编号</dt>
              <dd class="mt-1 font-mono">0730-2611010525/01</dd>
            </div>
            <div>
              <dt class="text-slate-500">发布时间</dt>
              <dd class="mt-1 font-mono">2026/08/13 18:06:21</dd>
            </div>
            <div>
              <dt class="text-slate-500">投标截止</dt>
              <dd class="mt-1 font-mono text-amber-200">
                {{ countdownText }}
              </dd>
            </div>
          </dl>

          <div>
            <h3 class="brand-serif text-xl">技术要点</h3>
            <ul class="mt-4 space-y-4">
              <li v-for="item in bid?.technical_points || points" :key="item.title">
                <p class="text-amber-200/90">{{ item.title }}</p>
                <p class="mt-1 text-sm text-slate-400 leading-relaxed">{{ item.body }}</p>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="brand-serif text-xl">技术创新性</h3>
            <ul class="mt-4 space-y-4">
              <li v-for="item in bid?.innovations || innovations" :key="item.title">
                <p class="text-sky-200">{{ item.title }}</p>
                <p class="mt-1 text-sm text-slate-400 leading-relaxed">{{ item.body }}</p>
              </li>
            </ul>
          </div>
        </div>

        <aside class="space-y-8">
          <div>
            <h3 class="brand-serif text-xl">投标资格要点</h3>
            <ol class="mt-4 space-y-2 text-sm text-slate-300">
              <li v-for="(q, i) in bid?.qualifications || quals" :key="q.id">
                {{ i + 1 }}. {{ q.label }}
              </li>
            </ol>
          </div>
          <div>
            <h3 class="brand-serif text-xl">关键词</h3>
            <p class="mt-3 text-sm leading-loose text-slate-400">
              {{ (bid?.keywords || keywords).join(' · ') }}
            </p>
          </div>
          <div>
            <h3 class="brand-serif text-xl">联系方式（演示脱敏）</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-300">
              <li v-for="c in bid?.contacts || []" :key="c.role">
                <span class="text-slate-500">{{ c.role }}</span>
                <span class="ml-2">{{ c.name }}</span>
                <span class="block text-slate-500">{{ c.place }} {{ c.phone }}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/stores/api'
import hero from '@/assets/hangar-hero.png'

const bid = ref(null)
const countdown = ref(null)
let timer = 0

const keywords = [
  '陕西飞机工业有限责任公司',
  '陕飞招标',
  '数字档案管理系统',
  '信创替代',
  '涉密信息系统集成',
  '0730-2611010525/01',
  '汉中招标',
  '航空工业',
]

const points = [
  { title: 'B/S 架构设计', body: '采用具备高可靠性、稳定性与易扩展性的 B/S 分布式架构。' },
  { title: '涉密分级保护合规', body: '全面遵循国家最新分保规范，落地密级标识、强制访问控制、“三员分立”管理、高强度身份鉴别与防篡改审计日志。' },
  { title: '软硬一体信创适配改造', body: '包含配套的 4 台信创专用服务器软硬件深度适配，支持纯国产环境平稳运行。' },
  { title: '18 个月超长无缺陷验证', body: '项目合同签订后需在 18 个月内无软件功能和逻辑问题发生方可最终通过验收。' },
]

const innovations = [
  { title: '全链路密级标签与零信任数据沙箱', body: '档案资产全生命周期附带多维密级安全元数据与动态人员水印防泄密。' },
  { title: '轻量化微服务/Serverless 高并发响应', body: '结合 Cloudflare 边缘计算与 D1/R2 体系，实现毫秒级档案元数据检索与大文件流式存储。' },
  { title: '信创服务器集群健康感知引擎', body: '实时监测 4 节点信创服务器计算资源与数据吞吐，提供长效稳定性预测保障。' },
]

const quals = [
  { id: 'q1', label: '独立法人资格及有效营业执照' },
  { id: 'q2', label: '涉密信息系统集成或分保相关业绩' },
  { id: 'q3', label: '信创服务器软硬件适配实施方案' },
  { id: 'q4', label: '18 个月缺陷责任期承诺函' },
  { id: 'q5', label: '三员分立与审计防篡改设计说明' },
]

const countdownText = computed(() => {
  const c = countdown.value
  if (!c) return '2026年9月4日'
  if (c.isExpired) return '已截止'
  return `${c.remainDays} 天 ${c.remainHours} 时 ${c.remainMinutes} 分后截止`
})

async function load() {
  try {
    const data = await api.bid()
    bid.value = data.bid
    countdown.value = data.countdown
  } catch {
    bid.value = {
      summary:
        '陕西飞机工业有限责任公司发布数字档案管理系统采购招标公告，需满足涉密分保与信创改造要求并含4台服务器，投标截止2026年9月4日。',
      technical_points: points,
      innovations,
      keywords,
      qualifications: quals,
    }
  }
}

onMounted(async () => {
  await load()
  timer = window.setInterval(load, 30000)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>
