<template>
    
  <div class="header" ref="root">
    <div class="background" ref="background">
    </div>
    <div class="navbar" ref="navbar">
      <div v-if="logo" class="logo">
        <a :href="`${config.baseurl}/`">
          <img :src="logo" :class="`${iconFilter ? 'icon-' + iconFilter : ''}`" alt="logo"/>
        </a>
      </div>
      
      <div class="branding">
        <div v-if="title" class="title">
          <a :href="`${config.baseurl}/`" v-html="title"></a>
        </div>
        <div v-if="subtitle" class="subtitle clamp1" v-html="subtitle"></div>
      </div>

      <div class="menu">
        <ez-menu v-if="navEl !== undefined" :contact="contact" v-html="navEl"></ez-menu>
      </div>
    </div>
    <ez-breadcrumbs v-if="breadcrumbs"></ez-breadcrumbs>
    <ez-manifest-popup v-if="manifest" :manifest="manifest"></ez-manifest-popup>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
  import { getManifest, imageDataUrl, getItemInfo, parseImageOptions } from '../utils'

  const window = (self as any).window

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const background = ref<HTMLElement | null>(null)
  const navbar = ref<HTMLElement | null>(null)
  const navEl = ref<string>()

  const config = ref<any>(window.config || {})

  const title = computed(() => props.title || config.value.meta?.title )
  const backgroundImage = computed(() => props.background || config.value.defaults?.header?.backgroundImage )
  const logo = computed(() => {
    let logo = props.logo || config.value.defaults?.header?.logo
    return logo.indexOf('http') === 0 ? logo : `${config.value.baseurl}/${logo}`
  })
  const iconFilter = computed(() => props.iconFilter === undefined ? config.value.defaults?.header?.iconFilter : props.iconFilter)
  const color = computed(() => props.color || backgroundImage.value ? 'black' : 'green' )
  const contact = computed(() => props.contact || config.value.defaults?.header?.contact )
  const breadcrumbs = computed(() => props.breadcrumbs || config.value.defaults?.header?.breadcrumbs )

  // watch(backgroundImage, (backgroundImage) => { console.log(`backgroundImage=${backgroundImage}`) })

  watch(navbar, (navbar) => { if (navbar) navbar.style.backgroundColor = toRGBA(color.value, props.alpha || backgroundImage.value ? 0.3 : 1.0) })

  const isSticky = ref<boolean>(false)
  const manifest = ref<any>()
  const imageOptions = ref<any>()
  const imageInfo = ref<any>()
  const imgUrl = ref<string>()

  const props = defineProps({
    alpha: { type: Number },
    background: { type: String },
    breadcrumbs: { type: Boolean, default: false },
    color: { type: String },
    contact: { type: String },
    height: { type: Number },
    logo: { type: String },
    options: { type: String },
    position: { type: String, default: 'center' },
    subtitle: { type: String },
    title: { type: String },
    top: { type: Number, default: 0 },
    iconFilter: { type: String }
  })

  watch(host, (host) => {
    console.log(toRaw(props))
    imageOptions.value = parseImageOptions(props.options || '')
    if (backgroundImage.value) getManifest(backgroundImage.value).then(_manifest => manifest.value = _manifest)
    if (background.value) background.value.style.height = props.height
      ? `${props.height}px`
      : backgroundImage.value
        ? '400px'
        : '100px'
    if (config.value.defaults?.header?.class) config.value.defaults.header.class.split(' ').forEach((className:string) => host.classList.add(className))
    isSticky.value = host.classList.contains('sticky')
    if (isSticky.value) {
      let styleTop = parseInt(host.style.top.replace(/px/,''))
      let top = props.top
        ? props.top
        : styleTop
          ? styleTop
          : backgroundImage.value
            ? -300
            : 0
      // console.log(`isSticky=${isSticky.value} top=${top}`)
      host.style.top = `${top}px`
    }
  })

  onMounted(() => {
    nextTick(() => {
      let ul = (host.value.querySelector('ul') as HTMLUListElement)
      if (!ul && config.value.defaults?.header?.nav) {
        ul = document.createElement('ul')
        config.value.defaults?.header?.nav.forEach((item:any) => {
          const li = document.createElement('li')
          const a = document.createElement('a')
          a.href = item.href
          a.innerHTML = item.label
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
    if (background.value) {
      background.value.style.backgroundImage = `url("${imgUrl.value}")`
      background.value.style.backgroundPosition = props.position
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

  const colors = {"aliceblue":"#f0f8ff", "antiquewhite":"#faebd7", "aqua":"#00ffff", "aquamarine":"#7fffd4", "azure":"#f0ffff", "beige":"#f5f5dc", "bisque":"#ffe4c4", "black":"#000000", "blanchedalmond":"#ffebcd", "blue":"#0000ff", "blueviolet":"#8a2be2", "brown":"#a52a2a", "burlywood":"#deb887", "cadetblue":"#5f9ea0", "chartreuse":"#7fff00", "chocolate":"#d2691e", "coral":"#ff7f50", "cornflowerblue":"#6495ed", "cornsilk":"#fff8dc", "crimson":"#dc143c", "cyan":"#00ffff", "darkblue":"#00008b", "darkcyan":"#008b8b", "darkgoldenrod":"#b8860b", "darkgray":"#a9a9a9", "darkgreen":"#006400", "darkkhaki":"#bdb76b", "darkmagenta":"#8b008b", "darkolivegreen":"#556b2f", "darkorange":"#ff8c00", "darkorchid":"#9932cc", "darkred":"#8b0000", "darksalmon":"#e9967a", "darkseagreen":"#8fbc8f", "darkslateblue":"#483d8b", "darkslategray":"#2f4f4f", "darkturquoise":"#00ced1", "darkviolet":"#9400d3", "deeppink":"#ff1493", "deepskyblue":"#00bfff", "dimgray":"#696969", "dodgerblue":"#1e90ff", "firebrick":"#b22222", "floralwhite":"#fffaf0", "forestgreen":"#228b22", "fuchsia":"#ff00ff", "gainsboro":"#dcdcdc", "ghostwhite":"#f8f8ff", "gold":"#ffd700", "goldenrod":"#daa520", "gray":"#808080", "green":"#008000", "greenyellow":"#adff2f", "honeydew":"#f0fff0", "hotpink":"#ff69b4", "indianred ":"#cd5c5c", "indigo":"#4b0082", "ivory":"#fffff0", "khaki":"#f0e68c", "lavender":"#e6e6fa", "lavenderblush":"#fff0f5", "lawngreen":"#7cfc00", "lemonchiffon":"#fffacd", "lightblue":"#add8e6", "lightcoral":"#f08080", "lightcyan":"#e0ffff", "lightgoldenrodyellow":"#fafad2", "lightgrey":"#d3d3d3", "lightgreen":"#90ee90", "lightpink":"#ffb6c1", "lightsalmon":"#ffa07a", "lightseagreen":"#20b2aa", "lightskyblue":"#87cefa", "lightslategray":"#778899", "lightsteelblue":"#b0c4de", "lightyellow":"#ffffe0", "lime":"#00ff00", "limegreen":"#32cd32", "linen":"#faf0e6", "magenta":"#ff00ff", "maroon":"#800000", "mediumaquamarine":"#66cdaa", "mediumblue":"#0000cd", "mediumorchid":"#ba55d3", "mediumpurple":"#9370d8", "mediumseagreen":"#3cb371", "mediumslateblue":"#7b68ee",  "mediumspringgreen":"#00fa9a", "mediumturquoise":"#48d1cc", "mediumvioletred":"#c71585", "midnightblue":"#191970", "mintcream":"#f5fffa", "mistyrose":"#ffe4e1", "moccasin":"#ffe4b5", "navajowhite":"#ffdead", "navy":"#000080", "oldlace":"#fdf5e6", "olive":"#808000", "olivedrab":"#6b8e23", "orange":"#ffa500", "orangered":"#ff4500", "orchid":"#da70d6", "palegoldenrod":"#eee8aa", "palegreen":"#98fb98", "paleturquoise":"#afeeee", "palevioletred":"#d87093", "papayawhip":"#ffefd5", "peachpuff":"#ffdab9", "peru":"#cd853f", "pink":"#ffc0cb", "plum":"#dda0dd", "powderblue":"#b0e0e6", "purple":"#800080", "rebeccapurple":"#663399", "red":"#ff0000", "rosybrown":"#bc8f8f", "royalblue":"#4169e1", "saddlebrown":"#8b4513", "salmon":"#fa8072", "sandybrown":"#f4a460", "seagreen":"#2e8b57", "seashell":"#fff5ee", "sienna":"#a0522d", "silver":"#c0c0c0", "skyblue":"#87ceeb", "slateblue":"#6a5acd", "slategray":"#708090", "snow":"#fffafa", "springgreen":"#00ff7f", "steelblue":"#4682b4", "tan":"#d2b48c", "teal":"#008080", "thistle":"#d8bfd8", "tomato":"#ff6347", "turquoise":"#40e0d0", "violet":"#ee82ee", "wheat":"#f5deb3", "white":"#ffffff", "whitesmoke":"#f5f5f5", "yellow":"#ffff00", "yellowgreen":"#9acd32"}
  
  //convert hex to rgb
  function toRGBA(color:string, alpha:number = 1.0) {
    let hex = color[0] === '#' ? color : colors[color.toLowerCase()]
    if (hex.length === 4) {
      let r = hex.slice(1,2)
      let g = hex.slice(2,3)
      let b = hex.slice(3,4)
      r = parseInt(r+r, 16)
      g = parseInt(g+g, 16)
      b = parseInt(b+b, 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    } else {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }

</script>

<style>

:host {
  display: block;
}

.header {
  display: grid;
  grid-template-rows: 1fr 100px auto;
  grid-template-columns: 1fr;
}

.background {
  grid-area: 1 / 1 / 3 / 2;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  z-index: 1;
  position: relative;
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

ez-manifest-popup {
  visibility: hidden;
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 10;
}

.header:hover ez-manifest-popup {
  visibility: visible;
  transition: all .5s ease-in;
}

ez-breadcrumbs {
  grid-area: 3 / 1 / 4 / 2;
  background-color: inherit;
  color: white;
  z-index: 1;
}

.branding {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title a {
  font-size: 1.5em;
  line-height: 1;
  font-weight: 500;
  text-decoration: none;
  color: inherit;
}

.subtitle {
  font-size: 1.5em;
  line-height: 1;
  font-weight: 400;
}

@media only screen and (max-width: 480px) {
  .title a {
    font-size: 1.3em;
  }
  .subtitle {
    font-size: 1em;
  }
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    /* width: 20%; */
    height: 90%;
}

.logo a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.logo img {
    height: 60%;
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

/******* Icon filters *******/

.icon-white {
  filter: invert(100%) sepia(0%) saturate(7487%) hue-rotate(339deg) brightness(115%) contrast(100%);
}

</style>