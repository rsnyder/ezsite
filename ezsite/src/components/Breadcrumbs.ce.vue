<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
  watch(shadowRoot, (shadowRoot) => {
    shadowRoot.children[1].classList.remove('sticky')
  })

  const crumbs = ref()

  onMounted(() => {
    let path = location.pathname
    let baseurl = (window as any).config?.baseurl || ''
    crumbs.value = [ 
      ...[{ name: 'home', path: baseurl }],
      ...path.split('/')
        .filter(pe => pe)
        .slice(baseurl?.split('/').filter(pe => pe).length)
        .map((path, index, paths) => ({ name: path, path: baseurl + '/' + paths.slice(0, index + 1).join('/')}))
    ]
  })

</script>

<template>
  <div class="inline-flex items-center gap-1 w-full flex-wrap leading-6" ref="root">
    <template v-for="(crumb, idx) in crumbs" :key="crumb.path">
      <a v-if="idx < crumbs.length - 1" :href="crumb.path" class="text-[#0645ad] hover:underline">{{ crumb.name }}</a>
      <span v-else class="text-gray-500">{{ crumb.name }}</span>
      <span v-if="idx < crumbs.length - 1" class="mx-2 text-gray-500"> > </span>
    </template>
  </div>
</template>

<style>
  @import '../tailwind.css';
</style>