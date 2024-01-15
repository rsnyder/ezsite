<script setup lang="ts">

  import { onMounted, ref } from 'vue'

  const crumbs = ref()

  onMounted(() => {
    let path = location.pathname
    let baseurl = (window as any).config.baseurl
    crumbs.value = [ 
      ...[{ name: 'home', path: baseurl }],
      ...path.split('/')
        .filter(pe => pe)
        .slice(baseurl.split('/').filter(pe => pe).length)
        .map((path, index, paths) => ({ name: path, path: '/' + paths.slice(0, index + 1).join('/')}))
    ]
  })

</script>

<template>
  <div class="inline-block mb-2">
    <template v-for="(crumb, idx) in crumbs" :key="crumb.path">
      <a :href="crumb.path" class="text-[#0645ad] hover:underline">{{ crumb.name }}</a>
      <span v-if="idx < crumbs.length - 1" class="mx-2 text-gray-500"> > </span>
    </template>
  </div>
</template>

<style>
  @import '../tailwind.css';
</style>