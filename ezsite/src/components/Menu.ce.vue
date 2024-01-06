<script setup lang="ts">

import { computed, ref, toRaw, watch } from 'vue'

// @ts-ignore
import { HSDropdown } from '../lib/preline/components/hs-dropdown'

const root = ref<HTMLElement | null>(null)
const host = computed(() => (root.value?.getRootNode() as any)?.host)
const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
watch(shadowRoot, () => { new HSDropdown(shadowRoot.value).init() })

watch(host, () => { getMenuItems() })

const menuItems = ref<any[]>([])
// watch(menuItems, () => { console.log(toRaw(menuItems.value)) })

const props = defineProps({
  logo: { type: String },
  title: { type: String }
})

function getMenuItems() {
  
  let slot = host.value.parentElement.querySelector('ez-menu')

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
</script>

<template>

  <nav class="hs-dropdown relative inline-flex" ref="root" >
    
    <button 
      id="hs-dropdown-custom-icon-trigger" 
      type="button"
      aria-label="Site navigation menu"
      class="hs-dropdown-toggle p-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
      <svg class="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
      </svg>
    </button>

    <div
      class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white shadow-md rounded-lg p-2 mt-2 dark:bg-gray-800 dark:border dark:border-gray-700" 
      aria-labelledby="hs-dropdown-custom-icon-trigger">
      <a v-for="item in menuItems" :key="item.href" 
        class="flex items-center gap-x-3.5 py-2 px-3 rounded-md text-sm text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300" 
        :href="item.href"
      >
        {{ item.label }}
      </a>
    </div>

  </nav>

</template>

<style>
  @import '../tailwind.css';
</style>
