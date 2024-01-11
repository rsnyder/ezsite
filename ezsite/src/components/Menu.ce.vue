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
        <svg v-if="item.icon" slot="prefix" v-html="item.icon.outerHTML"></svg>
        <span v-else slot="prefix" style="width:1em;margin-right: 1em;"></span>
      </sl-menu-item>
    </sl-menu>
  </sl-dropdown>

</template>
  
<script setup lang="ts">

  import { computed, ref, toRaw, watch } from 'vue'

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => { getMenuItems() })

  const menuItems = ref<any[]>([])
  // watch(menuItems, () => console.log('menuItems', toRaw(menuItems.value)))

  function getMenuItems() {
    function parseSlot() {
      menuItems.value = Array.from(host.value.querySelectorAll('li'))
        .map((li: any) => {
          const a = li.querySelector('a') as HTMLAnchorElement
          let label = a.innerText.trim()
          let icon = li.querySelector('svg') as SVGElement
          return { label, icon, href: a.href }
        })
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
    if (action === 'search') window.open(item.href, '_blank');
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

</script>

<style>
  @import '../tailwind.css';
  sl-menu-item svg {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin-right: 1em;
  }
</style>
