<template>

  <section ref="root"
    class="flex sticky top-0 items-center w-full pl-4 z-10 bg-[#000]/30"
    :style="{height: `${props.height}px`}">
    
    <div v-if="props.logo" class="logo">
      <a v-if="props.url" :href="props.url">
        <img :src="props.logo" alt="logo"/>
      </a>
      <img v-else :src="props.logo" alt="logo"/>
    </div>

    <div class="flex flex-col gap-2 ml-4">
      <div class="title" v-html="props.label"></div>
      <div v-if="props.subtitle" class="subtitle clamp1" v-html="props.subtitle"></div>
    </div>
    
    <div class="flex items-center gap-4 mr-4 ml-auto">
      <ve-site-search v-if="props.searchDomain" :search-domain="props.searchDomain" :search-cx="props.searchCx" :search-key="props.searchKey"></ve-site-search>
      <ve-menu v-if="navEl !== undefined" :auth="auth" :contact="contact" v-html="navEl"></ve-menu>
    </div>

  </section>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, onUpdated, ref, toRaw, watch } from 'vue'

  const props = defineProps({
    label: { type: String },
    subtitle: { type: String },
    background: { type: String},
    logo: { type: String },
    url: { type: String },
    auth: { type: String }, // "github" or "netlify"
    alpha: { type: Number },
    contact: { type: String },
    sticky: { type: Boolean, default: false },
    height: { type: Number, default: 80 },
    offset: { type: Number, default: 0 },
    searchDomain: { type: String },
    searchCx: { type: String },
    searchKey: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadow = computed(() => root?.value?.parentNode?.querySelector('section') as HTMLElement)
  watch(shadow, () => applyProps() )

  const navEl = ref<string>()
  // watch(navEl, () => console.log(toRaw(navEl.value)) )

  onMounted(() => {
    nextTick(() => {
      let ul = (host.value.querySelector('ul') as HTMLUListElement)
      if (!ul && (window as any).config?.defaults?.header?.nav) {
        ul = document.createElement('ul');
        (window as any).config?.defaults?.header?.nav.forEach((item:any) => {
          const li = document.createElement('li')
          const a = document.createElement('a')
          a.href = item.href
          a.innerHTML = `${item.icon}${item.label}`
          li.appendChild(a)
          ul.appendChild(li)
        })
      }
      navEl.value = ul.innerHTML
    })
  })

  watch(props, () => applyProps())

  function applyProps() {
    shadow.value.style.height = `${props.height}px`
    if (props.background) host.value.style.backgroundColor = props.background
    if (props.offset) shadow.value.style.marginTop = `-${props.offset}px`
    if (props.sticky) {
      host.value.classList.add('sticky')
      host.value.style.position = 'sticky'
      // host.value.style.top = '0'
      // if (props.alpha) host.value.style.background = `rgba(0, 0, 0, ${props.alpha})`
      host.value.style.background = '#444A1E'
      host.value.style.opacity = '100'
      host.value.style.marginTop = `-${props.offset}px`
    }
    if (props.label) {
      let titleEl = document.querySelector('title')
      if (!titleEl) {
        titleEl = document.createElement('title')
        document.head.appendChild(titleEl)
      }
      titleEl.innerText = props.label
    }
  }

</script>

<style>
  @import '../tailwind.css';

  .title {
    font-size: 2em;
    line-height: 1;
    font-weight: 500;
    text-decoration: none;
    color: white;
  }

  .subtitle {
    font-size: 1.3em;
    line-height: 1;
    font-weight: 400;
    color: white;
  }

  @media only screen and (max-width: 480px) {
    .title {
      font-size: 1.3em;
    }
    .subtitle {
      font-size: 1em;
    }
  }

  .logo {
    display: flex;
    height: 90%;
  }

  .logo img {
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
  }

  .menu {
    margin-left: auto;
  }

  .clamp1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;  
    overflow: hidden;
  }

</style>