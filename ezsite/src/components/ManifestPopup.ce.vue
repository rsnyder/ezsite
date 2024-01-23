<script setup lang="ts">

  import { computed, ref, watch } from 'vue'

  // @ts-ignore
  import { HSTooltip } from '../lib/preline/components/hs-tooltip'
  
  const root = ref<HTMLElement | null>(null)

  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
  watch(shadowRoot, () => { new HSTooltip(shadowRoot.value).init() })

  const props = defineProps({
    manifest: { type: Object, required: true }
  })

</script>

<template>

  <div ref="root" class="hs-tooltip inline-block [--trigger:click] [--placement:bottom]">
    <a class="hs-tooltip-toggle block text-center" href="javascript:;" title="Click for more information">
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
      </div>
      <div class="hs-tooltip-content z-30 hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible hidden opacity-0 transition-opacity absolute invisible max-w-xs bg-white border border-gray-100 text-left rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700" role="tooltip">
        <div class="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
          <div class="p-4 md:p-5">
            <ez-manifest v-if="manifest" :manifest="manifest"></ez-manifest>
          </div>
        </div>
      </div>

    </a>
  </div>

</template>

<style>
  @import '../tailwind.css';
  svg {
    filter: invert(100%) sepia(0%) saturate(7487%) hue-rotate(339deg) brightness(115%) contrast(100%);
  }
  .icon-wrapper {
    background: rgba(0,0,0,.4);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    text-align: center;
    vertical-align: middle;
    padding: 5px;
  }

</style>
