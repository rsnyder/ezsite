<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'

  // @ts-ignore
  import { HSCollapse } from '../lib/preline/components/hs-collapse'

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  onMounted(() => {
    new HSCollapse(shadowRoot.value).init()
  })

</script>

<template>

  <div ref="root">
    <button type="button" class="hs-collapse-toggle py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800" id="hs-basic-collapse" data-hs-collapse="#hs-basic-collapse-heading">
      Collapse
      <svg class="hs-collapse-open:rotate-180 w-2.5 h-2.5 text-white" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <div id="hs-basic-collapse-heading" class="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" aria-labelledby="hs-basic-collapse">
      <div class="mt-5">
        <p class="text-gray-500 dark:text-gray-400">
          This is a collapse body. It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
  @import '../tailwind.css';
</style>
