<template>

  <ul ref="footer" class="flex bg-slate-100 p-2 gap-3 mt-8 items-center w-full h-8">
    <li v-for="li, idx in footerElems" :key="`li-${idx}`" v-html="li.innerHTML" :class="li.className" :style="li.getAttribute('style') || ''"></li>
    <li>
      <a href="javascript:;" @click="generatePDF"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Noun_Project_PDF_icon_117327_cc.svg" alt="PDF Icon"></a>
    </li>
  </ul>

</template>
  
<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { marked } from 'marked'

  const footerElems = ref<HTMLLIElement[]>([])

  const footer = ref<HTMLElement | null>(null)
  const host = computed(() => (footer.value?.getRootNode() as any)?.host)

  watch(host, () => { getFooterItems() })

  function getFooterItems() {
    function parseSlot() {
      console.log(host.value)
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

  function generatePDF() {
    console.log('generatePDF')
    window.open(`https://ezsitepdf-drnxe7pzjq-uc.a.run.app/pdf?url=${location.href}`, '_blank')

  }

</script>

<style>
  @import '../tailwind.css';

img,
svg {
  height: 36px;
  width: 36px;
}

.push {
  margin-left: auto;
}
</style>