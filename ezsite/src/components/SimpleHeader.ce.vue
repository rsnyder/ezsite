<template>
    
  <div class="header background" ref="root">
    <div class="navbar">
      <div v-if="logo" class="logo">
        <a v-if="url" :href="url">
          <img :src="logo" :class="`${iconFilter ? 'icon-' + iconFilter : ''}`" alt="logo"/>
        </a>
        <img v-else :src="logo" :class="`${iconFilter ? 'icon-' + iconFilter : ''}`" alt="logo"/>
      </div>
      <div class="branding">
        <div v-if="title" class="title" v-html="title"></div>
        <div v-if="subtitle" class="subtitle" v-html="subtitle"></div>
      </div>
      <div class="menu">
        <ez-menu v-if="navEl !== undefined" :contact="contact" v-html="navEl"></ez-menu>
      </div>
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
  import { getManifest, imageDataUrl, getItemInfo, parseImageOptions } from '../utils'

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
  const navEl = ref<string>()

  const isSticky = ref<boolean>(false)
  const manifest = ref<any>()
  const imageOptions = ref<any>()
  const imageInfo = ref<any>()
  const imgUrl = ref<string>()

  const props = defineProps({
    background: { type: String },
    contact: { type: String },
    height: { type: Number, default: 400 },
    logo: { type: String },
    options: { type: String },
    position: { type: String, default: 'center' },
    subtitle: { type: String },
    title: { type: String },
    top: { type: Number, default: 0 },
    url: { type: String },
    iconFilter: { type: String }
  })

  watch(host, (host) => {
    imageOptions.value = parseImageOptions(props.options || '')
    if (props.background) getManifest(props.background).then(_manifest => manifest.value = _manifest)
    host.style.height = `${props.height}px`
    isSticky.value = host.classList.contains('sticky')
  })

  watch(shadowRoot, (shadowRoot) => {
    console.log('shadowRoot', shadowRoot)
    if (isSticky.value) {
      // shadowRoot.children[1].classList.remove('sticky')
      // shadowRoot.children[1].style.top = '0'
    }
  })

  watch(isSticky, (isSticky) => {
    console.log('isSticky', isSticky)
  })

  onMounted(() => {
    nextTick(() => {
      let ul = (host.value.querySelector('ul') as HTMLUListElement)
      if (!ul && (window as any).config?.nav) {
        ul = document.createElement('ul');
        (window as any).config?.nav.forEach((item:any) => {
          const li = document.createElement('li')
          const a = document.createElement('a')
          a.href = item.href
          a.innerHTML = `${item.icon}${item.label}`
          li.appendChild(a)
          ul.appendChild(li)
        })
      }
      navEl.value = ul?.innerHTML
    })
  })

  watch(manifest, (val: object, priorVal: object) => {
    if (val !== priorVal) imageInfo.value = getItemInfo(val)
  })

  watch(imageInfo, async (val: any, priorVal: any) => {
    if (val !== priorVal) {
      imgUrl.value = val.service
        ? iiifUrl(val.service[0].id || val.service[0]['@id'], imageOptions.value)
        : await imageDataUrl(imageInfo.value.id, imageOptions.value.region, {width: host.value.clientWidth, height: props.height})
    }
  })

  watch(imgUrl, () => {
    host.value.style.backgroundImage = `url("${imgUrl.value}")`
    host.value.style.backgroundPosition = props.position
    if (isSticky.value) {
      let styleTop = parseInt(host.value.style.top.replace(/px/,''))
      let top = props.top
        ? props.top
        : styleTop
          ? styleTop
          : -300
      console.log(`isSticky=${isSticky.value} top=${top}`)
      host.value.style.top = `${top}px`
    }
  })

  function iiifUrl(serviceUrl: string, options: any) {
    let _imageInfo = imageInfo.value
    let _imageAspect = Number((_imageInfo.width/_imageInfo.height).toFixed(4))
    let width = Math.min(800, host.value.getBoundingClientRect().width)
    let height =  Number(width / _imageAspect).toFixed(0)
    let size = `${width},${height}`
    let url = `${serviceUrl.replace(/\/info.json$/,'')}/${options.region}/${size}/${options.rotation}/${options.quality}.${options.format}`
    return url
  }

</script>

<style>

:host {
  display: block;
}

.header {
  display: grid;
  grid-template-rows: 300px 100px;
  grid-template-columns: 1fr;
}

.background {
  grid-area: 1 / 1 / 3 / 2;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.navbar {
  grid-area: 2 / 1 / 3 / 2;
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0 20px;
}

.branding {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title {
  font-size: 2.2em;
  line-height: 1;
  font-weight: 500;
}

.subtitle {
  font-size: 1.5em;
  line-height: 1;
  font-weight: 400;
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 100%;
}

.logo img {
    height: 80%;
    object-fit: contain;
    vertical-align: middle;
}

.menu {
  margin-left: auto;
}

/******* Icon filters *******/

.icon-white {
  filter: invert(100%) sepia(0%) saturate(7487%) hue-rotate(339deg) brightness(115%) contrast(100%);
}

</style>