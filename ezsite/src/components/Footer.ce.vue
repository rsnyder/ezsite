<template>

  <ul ref="footer" id="footer" class="flex bg-slate-100 p-2 gap-3 mt-8 items-center w-full h-8">
    <li v-for="li, idx in footerElems" :key="`li-${idx}`" v-html="li.innerHTML" :class="li.className" :style="li.getAttribute('style') || ''"></li>
    <!--
    <li>
      <a :href="url" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Noun_Project_PDF_icon_117327_cc.svg" alt="PDF Icon"></a>
    </li>
    <li>
      <a href="javascript:;" @click="generatePDF"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f5/Cloud_Download_-_The_Noun_Project.svg" alt="Download Icon"></a>
    </li>
    -->
  </ul>

  <!-- Generating PDF Dialog -->
  <div ref="overlayRef">
    <div ref="modalRef" id="hs-basic-modal" class="hs-overlay hidden w-full h-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none">
      <div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
        <div class="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
          <div class="p-4 overflow-y-auto flex items-center gap-4">
            <sl-spinner style="font-size: 3rem; --indicator-color: deeppink; --track-color: pink;"></sl-spinner>
            <p v-html="modalText"></p>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, ref, watch } from 'vue'
  import { marked } from 'marked'

  // @ts-ignore
  import { HSOverlay } from '../lib/preline/components/hs-overlay'

  const footerElems = ref<HTMLLIElement[]>([])

  const footer = ref<HTMLElement | null>(null)
  const host = computed(() => (footer.value?.getRootNode() as any)?.host)

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

  watch(host, () => { getFooterItems() })

  const url = ref(`https://ezsitepdf-drnxe7pzjq-uc.a.run.app/pdf?url=${location.href}`)

  const props = defineProps({
    class: { type: String }
  })

  function getFooterItems() {
    function parseSlot() {
      return Array.from(host.value.querySelectorAll('li') as HTMLUListElement[])
      .map(li => {
        let newLi = document.createElement('li')
        newLi.innerHTML = marked.parse(li.textContent || '')
        let codeEl = newLi.querySelector('code')
        if (codeEl) {
          let priorEl = codeEl.previousElementSibling
          let target = priorEl ? priorEl : newLi
          let parsed:any = parseCodeEl(codeEl.innerHTML)
          if (parsed.id) target.id = parsed.id
          if (parsed.class) parsed.class.split(' ').forEach(c => target.classList.add(c))
          if (parsed.style) target.setAttribute('style', parsed.style)
          codeEl.remove()
        }
        return newLi
      })
    }
    footerElems.value = parseSlot()
    new MutationObserver(
      (mutationsList:any) => {
        for (let mutation of mutationsList) { if (mutation.type === 'childList') footerElems.value = parseSlot() }      
      }
    ).observe(host.value, { childList: true, subtree: true })
  }

  function parseCodeEl(s:string) {
    let tokens:string[] = []
    s = s.replace(/”/g,'"').replace(/”/g,'"').replace(/’/g,"'")
    s?.match(/[^\s"]+|"([^"]*)"/gmi)?.filter(t => t).forEach((token:string) => {
      if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
      else tokens.push(token)
    })
    let parsed = {}
    let tokenIdx = 0
    while (tokenIdx < tokens.length) {
      let token = tokens[tokenIdx]
      if (token.indexOf('=') > 0) {
        let [key, value] = token.split('=')
        value = value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value
        if (parsed[key]) parsed[key] += ` ${value}`
        else parsed[key] = value
      }
      else if (token[0] === '.') {
        let key = 'class'
        let value = token.slice(1)
        value = value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value
        if (parsed[key]) parsed[key] += ` ${value}`
        else parsed[key] = value
      }
      else if (token[0] === ':') {
        let key = 'style'
        let value
        if (token.length === 1 && tokenIdx < token.length && tokens[tokenIdx+1][0] === '"') {
          value = tokens[tokenIdx+1].slice(1, -1)
          tokenIdx++
        } else {
          value = token.slice(1)
        }
        if (parsed[key]) parsed[key] += ` ${value}`
        else parsed[key] = value
      }
      else if (token[0] === '"') {
        let key = 'args'
        let value = token.slice(1,-1)
        if (parsed[key]) parsed[key].push(value)
        else parsed[key] = [value]
      }
      else if (token[0] === '#') parsed['id'] = token.slice(1)
      else parsed[token] = true
      tokenIdx++
    }
    return parsed
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

</script>

<style>
  @import '../tailwind.css';

img,
svg {
  height: 36px;
  /* width: 36px; */
}

.push {
  margin-left: auto;
}

@media only screen and (max-width: 375px) {
  #footer {
    font-size: 0.8em;
  }
  li {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.overlay {
  position: fixed; /* Sit on top of the page content */
  display: none; /* Hidden by default */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5); /* Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
  cursor: pointer; /* Add a pointer on hover */
}

</style>