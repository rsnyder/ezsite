<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'

  // @ts-ignore
  import { HSOverlay } from '../lib/preline/components/hs-overlay'

  const overlayRef = ref<HTMLElement | null>(null)
  const modalRef = ref<HTMLElement | null>(null)
  const host = computed(() => (overlayRef.value?.getRootNode() as any)?.host)

  const _overlay = computed(() => overlayRef?.value as HTMLElement)
  const modal = computed(() => modalRef?.value as HTMLElement)

  const overlay = computed(() =>  new HSOverlay(_overlay.value) )
  
  watch(modal, () => { 
    overlay.value.init()
    modal.value.addEventListener('open.hs.overlay', (e:any) => isOpen.value = true)
    modal.value.addEventListener('close.hs.overlay', (e:any) => isOpen.value = false)
  })

  const isOpen = ref(false)
  watch(isOpen, (isOpen) => {
    if (isOpen) {
      overlay.value.open(modal.value)
      host.value.setAttribute('open', '')
    } else {
      overlay.value.close(modal.value)
      host.value.removeAttribute('open' )
    } 
  })

  const props = defineProps({
    open: { type: Boolean, default: false }
  })

  watch(props, () => {
    isOpen.value = props.open
  })

  onMounted(() => {
    isOpen.value = props.open
  })

</script>

<template>
  <div ref="overlayRef">

    <!--
    <button type="button" class="py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800" data-hs-overlay="#hs-basic-modal">
      Open modal
    </button>
    -->

    <div ref="modalRef" id="hs-basic-modal" class="hs-overlay hidden w-full h-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none">
      <div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
        <div class="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">

          <div class="p-4 overflow-y-auto">
            <p class="mt-1 text-gray-800 dark:text-gray-400">
              <slot></slot>
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style>
  @import '../tailwind.css';
</style>
