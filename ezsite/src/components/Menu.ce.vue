<template>

  <sl-dropdown ref="root">
    <sl-button slot="trigger">
      <svg xmlns="http://www.w3.org/2000/svg" slot="prefix" width="16" height="16" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
      </svg>
    </sl-button>
    <sl-menu>
      <sl-menu-item v-for="item in menuItems" @click="menuItemSelected(item, $event)">
        <span v-html="item.label"></span>
        <svg v-if="item.icon" slot="prefix" v-html="item.icon"></svg>
        <span v-else slot="prefix" style="width:1em; margin-right:1em;"></span>
      </sl-menu-item>
      <sl-menu-item v-if="pdfDownloadEnabled" @click="generatePDF">
        <span>Download as PDF</span>
        <img slot="prefix" width="16" src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Noun_Project_PDF_icon_117327_cc.svg" alt="PDF Download Icon">
      </sl-menu-item>
    </sl-menu>
  </sl-dropdown>

  <!-- Generating PDF Dialog -->
  <div ref="overlayRef">
    <div ref="modalRef" id="hs-basic-modal" class="hs-overlay hidden w-full h-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none">
      <div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
        <div class="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
          <div class="p-4 overflow-y-auto flex items-center gap-4 text-black">
            <sl-spinner style="font-size: 3rem; --indicator-color: deeppink; --track-color: pink;"></sl-spinner>
            <p v-html="modalText"></p>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, toRaw, watch } from 'vue'

  // @ts-ignore
  import { HSOverlay } from '../lib/preline/components/hs-overlay'

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => { 
    getMenuItems() 
  })

  const overlayRef = ref<HTMLElement | null>(null)
  const overlayEl = computed(() => overlayRef?.value as HTMLElement)
  const overlay = computed(() =>  new HSOverlay(overlayEl.value) )

  const modalRef = ref<HTMLElement | null>(null)
  const modalEl = computed(() => modalRef?.value as HTMLElement)

  const modalText = ref('Generating PDF...')

  watch(modalEl, (modal) => { 
    overlay.value.init()
    modal.addEventListener('open.hs.overlay', (e:any) => isOpen.value = true)
    modal.addEventListener('close.hs.overlay', (e:any) => isOpen.value = false)
  })

  const isOpen = ref(false)
  watch(isOpen, (isOpen) => {
    if (isOpen) overlay.value.open(modalEl.value)
    else overlay.value.close(modalEl.value)
  })

  const props = defineProps({
    contact: { type: String },
    pdfDownloadEnabled: { type: Boolean, default: false}
  })

  const menuItems = ref<any[]>([])
  // watch(menuItems, () => console.log('menuItems', toRaw(menuItems.value)))

  function getMenuItems() {
    function parseSlot() {
      let items = Array.from(host.value.querySelectorAll('li'))
        .map((li: any) => {
          const a = li.querySelector('a') as HTMLAnchorElement
          let label = a.innerText.trim()
          let icon = (li.querySelector('svg') as SVGElement)?.outerHTML
          if (!icon) {
            let action = a.href.split('/').filter((x:string) => x).pop()?.toLowerCase() || ''
            action = location.host === action ? 'home' : action
            if (icons[action]) icon = icons[action]
          }
          return { label, icon, href: a.href }
        })
        if (props.contact) items.push({ label: 'Contact Us', icon: icons.contact, href: '/contact' })
      menuItems.value = items
    }
    parseSlot()
    new MutationObserver(
      (mutationsList:any) => {
        for (let mutation of mutationsList) { if (mutation.type === 'childList') parseSlot() }      
      }
    ).observe(host.value, { childList: true, subtree: true })
  }

  function menuItemSelected(item: any, evt:Event) {
    let action = item.href.split('/').filter((x:string) => x).pop().toLowerCase()
    action = location.host === action ? 'home' : action
    if (action === 'contact') mailto()
    else {
      let href = new URL(item.href)
      if (href.origin === location.origin) {
        let baseurl = ((window as any)?.config || {})?.baseurl || ''
        let path = `${baseurl}${href.pathname}`
        location.pathname = path
      } else {
        location.href = item.href
      }
    }
  }

  function mailto() {
    const email = props.contact
    const subject = `${(window as any).config.title} Contact`
    const bodyText = ''
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${bodyText}`
    window.open(mailtoLink, '_blank')
  }

  async function generatePDF() {
    console.log(`Generating PDF for ${location.href}`)
    modalText.value = 'Generating PDF...'
    isOpen.value = !isOpen.value
    let resp = await fetch(`https://ezsitepdf-drnxe7pzjq-uc.a.run.app/pdf?url=${location.href}`)
    if (resp.ok) {
      modalText.value = 'Downloading PDF...'
      let pdf = await resp.blob()
      const aElement = document.createElement('a')
      aElement.setAttribute('download', 'resume.pdf')
      const href = URL.createObjectURL(pdf)
      aElement.href = href
      aElement.setAttribute('target', '_blank')
      aElement.click()
      aElement.addEventListener
      URL.revokeObjectURL(href)
    }
    setTimeout(() => isOpen.value = false, 2000)
  }

  const icons = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>',
    about: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>',
    contact: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>'
  }

</script>

<style>
  @import '@shoelace-style/shoelace/dist/themes/light.css';
  @import '../tailwind.css';
  sl-menu-item svg {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin-right: 1em;
  }
</style>
