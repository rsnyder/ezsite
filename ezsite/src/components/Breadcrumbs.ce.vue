<script setup lang="ts">

  import { onMounted, ref, watch } from 'vue'

  const crumbs = ref()
  watch(crumbs, () => console.log(crumbs.value))

  onMounted(() => {
    let path = location.pathname
    let baseurl = (window as any).config.baseurl
    console.log(`path: ${path}, baseurl: ${baseurl}`)
    crumbs.value = [ 
      ...[{ name: 'Home', path: '/' }],
      ...path.split('/')
        .filter(pe => pe)
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