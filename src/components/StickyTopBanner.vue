<template>
  <div
    class="fixed top-0 left-0 w-full h-[40px] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between px-4 text-xs sm:text-sm font-medium border-b border-blue-500/30 z-[9999] select-none shadow-md"
    style="position: fixed; top: 0; width: 100%; height: 40px;"
  >
    <div class="flex items-center space-x-2 truncate">
      <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-slate-300 font-semibold">[陕飞项目公开演示通道]</span>
      <span class="text-slate-200 truncate">获取网站源码，请访问：</span>
      <a
        href="https://github.com/softwarelink-net/26-sf-dams-bid"
        target="_blank"
        rel="noopener noreferrer"
        class="text-amber-400 hover:text-amber-300 underline font-mono ml-1 flex items-center transition-colors"
      >
        https://github.com/softwarelink-net/26-sf-dams-bid
      </a>
    </div>
    <div class="hidden md:flex items-center space-x-3 text-slate-400 text-xs">
      <span class="bg-blue-950/80 border border-blue-400/40 px-2 py-0.5 rounded text-blue-300">密级：内部公开演示</span>
      <span>信创集群节点：4/4 在线</span>
    </div>
  </div>
</template>
