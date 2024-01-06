<script setup lang="ts">

import { computed, ref, toRaw, watch } from 'vue'

const root = ref<HTMLElement | null>(null)
const host = computed(() => (root.value?.getRootNode() as any)?.host)

const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
const header = computed(() => shadowRoot.value?.querySelector('header'))
watch(header, (header) => { if (header) header.style.backgroundColor = props.color})

watch(host, () => { getMenuItems() })

function getMenuItems() {
  
  let slot = host.value.parentElement.querySelector('ez-header')

  function parseSlot() {
    menuItems.value = Array.from(slot.querySelectorAll('li'))
      .map((li: any) => {
        const a = li.querySelector('a')
        return { label: a.innerText, href: a.href }
      })
    }
    
  parseSlot()
  new MutationObserver(
    (mutationsList:any) => {
      for (let mutation of mutationsList) { if (mutation.type === 'childList') parseSlot() }      
    }
  ).observe(slot, { childList: true, subtree: true })
}

const title = computed(() => props.title)
const menuItems = ref<any[]>([])
watch(menuItems, (items) => {
  console.log('menuItems', items)
})

const props = defineProps({
  title: { type: String },
  logo: { type: String },
  color: { type: String, default: '#444' }
})

</script>

<template>
  
  <header ref="root"
    class="relative flex flex-wrap 2xl:justify-start 2xl:flex-nowrap z-30 w-full text-sm py-4 dark:bg-gray-800">
    
    <div class="max-w-[85rem] w-full mx-auto px-4 2xl:flex 2xl:items-center 2xl:justify-between" aria-label="Global">

      <div class="flex items-center gap-3 justify-between">
        <img v-if="logo" :src="logo" alt="Website Logo" class="h-[3em] max-w-none">
        <div v-else></div>
        <h1 v-if="title" v-html="title" class="text-3xl text-white font-semibold"></h1>
        <div v-else></div>
        <ez-menu v-if="menuItems.length">
          <ul>
            <li v-for="item in menuItems" :key="item.href">
              <a :href="item.href">{{ item.label }}</a>
            </li>
          </ul>
        </ez-menu>
        <div v-else></div>
      </div>
  
    </div>

  </header>

</template>

<style>
  @import '../tailwind.css';
</style>
