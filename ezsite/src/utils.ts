import { marked } from 'marked'
import { nextTick } from 'vue'
import { Md5 } from 'ts-md5'

export const iiifServer = 'https://iiif.juncture-digital.org'

export function isURL(str:string) { return /^https*:\/\//.test(str) }
export function isQid(s:string) { return /^Q\d+$/.test(s) }
export function isCoords(s:string) { return /^[+-]?\d+(.\d*|\d*),{1}[+-]?\d+(.\d*|\d*)$/.test(s) }
export function isNumeric(arg:any) { return !isNaN(arg) }

export const isGHP = /\.github\.io$/.test(location.hostname)

const window = (globalThis as any).window as any

export function md2html(markdown: string) { return marked.parse(markdown) }

export async function getConfig() {
  let configExtras: any = {}
  let baseurl = window.config?.baseurl !== undefined
    ? window.config?.baseurl
    : isGHP ? `/${location.pathname.split('/')[1]}` : ''
  const configUrls = [
    location.hostname === 'localhost' ? 'http://localhost:8080/ezsite/default_config.yml' : 'https://rsnyder.github.io/ezsite/ezsite/default_config.yml',
    location.hostname === 'localhost' ? 'http://localhost:8080/config.yml' : `${baseurl}/config.yml`
  ]
  for (const configUrl of configUrls) {
    let resp = await fetch(configUrl)
    if (resp.ok) {
      configExtras = {...configExtras, ...window.jsyaml.load(await resp.text())}
    }
  }
  window.config = {
    ...window.config,
    ...configExtras,
    isGHP, 
    baseurl
  }
  if (isGHP) {
    if (!window.config.owner) window.config.owner = location.hostname.split('.')[0]
    if (!window.config.repo) window.config.repo = location.pathname.split('/')[1]
  }
  return window.config
}

export function setMeta() {
  let meta
  let header
  Array.from(document.getElementsByTagName('*')).forEach(el => {
    if (!/^\w+-\w+/.test(el.tagName)) return
    if (el.tagName.split('-')[1] === 'META') meta = el
    else if (el.tagName.split('-')[1] === 'HEADER') header = el
  })
  if (!meta) meta = document.querySelector('param[ve-config]')

  let firstHeading = (document.querySelector('h1, h2, h3') as HTMLElement)?.innerText.trim()
  let firstParagraph = document.querySelector('p')?.innerText.trim()
  
  let jldEl = document.querySelector('script[type="application/ld+json"]') as HTMLElement
  let seo = jldEl ? JSON.parse(jldEl.innerText) : {'@context':'https://schema.org', '@type':'WebSite', description:'', headline:'', name:'', url:''}
  seo.url = location.href

  let title = meta?.getAttribute('title')
    ? meta.getAttribute('title')
    : window.config.title
      ? window.config.title
      : header?.getAttribute('label')
        ? header.getAttribute('label')
        : firstHeading || ''

  let description =  meta?.getAttribute('description')
    ? meta.getAttribute('description')
    : window.config.description
      ? window.config.description
      : firstParagraph || ''

  let robots = meta?.getAttribute('robots')
    ? meta?.getAttribute('robots')
    : window.config.robots
      ? window.config.robots
      : location.hostname.indexOf('www') === 0
        ? '' 
        : 'noindex, nofollow'

  if (title) {
    document.title = title
    seo.name = title
    seo.headline = title
    document.querySelector('meta[name="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', title)
    document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', title)
  }
  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    seo.description = description
  }
  if (robots) {
    let robotsMeta = document.createElement('meta')
    robotsMeta.setAttribute('name', 'robots')
    robotsMeta.setAttribute('content', robots)
    document.head.appendChild(robotsMeta)
  }

  if (meta && meta.getAttribute('ve-config') === null) meta.remove()
  if (jldEl) jldEl.innerText = JSON.stringify(seo)

  window.config = {...window.config, ...{meta: {title, description, robots, seo}}}
}

function computeDataId(el:HTMLElement) {
  let dataId: number[] = []
  while (el.parentElement) {
    let siblings: HTMLElement[] = Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName) as HTMLElement[]
    dataId.push(siblings.indexOf(el) + 1)
    el = el.parentElement
  }
  return dataId.reverse().join('.')
}

function parseHeadline(s:string) {
  let tokens:string[] = []
  s = s.replace(/”/g,'"').replace(/”/g,'"').replace(/’/g,"'")
  s?.match(/[^\s"]+|"([^"]*)"/gmi)?.filter(t => t).forEach((token:string) => {
    if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
    else tokens.push(token)
  })
  let parsed = {}
  tokens.forEach(token => {
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
      let value = token.slice(1)
      value = value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value
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
    else if (/^\w+-\w+$/.test(token)) parsed['tag'] = token
    else parsed[token] = true
  })
  return parsed
}

function parseCodeEl(codeEl:HTMLElement) {
  let codeElems = codeEl.textContent?.replace(/\s+\|\s+/g,'\n').split('\n').map(l => l.trim()).filter(x => x) || []
  let parsed: any = parseHeadline(codeElems?.[0]) || {}
  if (codeElems.length > 1) parsed.args = parsed.args ? [...parsed.args, ...codeElems.slice(1)] : codeElems.slice(1)
  return parsed
}

function handleCodeEl(codeEl:HTMLElement) {
  if (codeEl.parentElement?.tagName === 'P' || codeEl.parentElement?.tagName === 'PRE') {
    let codeWrapper = (codeEl.parentElement?.tagName === 'P' 
      ? Array.from(codeEl.parentElement?.childNodes).map(c => c.nodeValue?.trim()).filter(x => x).join('')
        ? codeEl
        : codeEl.parentElement
      : codeEl.parentElement?.parentElement?.parentElement
    ) as HTMLElement
    let parent = codeWrapper.parentElement as HTMLElement
    let codeLang = codeEl.parentElement?.tagName === 'PRE' 
      ? Array.from(parent.classList).find(cls => cls.indexOf('language') === 0)?.split('-').pop() || 'ezsite'
      : 'ezsite'
      if (codeLang === 'ezsite') {
      let parsed = parseCodeEl(codeEl)
      if (parsed.tag) {
        let ezComponent = document.createElement(parsed.tag)
        if (parsed.id) ezComponent.id = parsed.id
        if (parsed.class) parsed.class.split(' ').forEach(c => ezComponent.classList.add(c))
        if (parsed.style) ezComponent.setAttribute('style', parsed.style)
        for (const [k,v] of Object.entries(parsed)) {
          if (k === 'tag' || k === 'id' || k === 'class' || k === 'style') continue
          ezComponent.setAttribute(k, v === true ? '' : v)
        }
        if (parsed.args) {
          let ul = document.createElement('ul')
          ezComponent.appendChild(ul)
          for (const arg of parsed.args) {
            let li = document.createElement('li')
            li.innerHTML = marked.parse(arg)
            ul.appendChild(li)
          }
        }
        codeWrapper.replaceWith(ezComponent)
      } else if (parsed.class || parsed.style || parsed.id) {
        let target
        let priorEl = codeEl.previousElementSibling as HTMLElement
        if (priorEl?.tagName === 'EM' || priorEl?.tagName === 'STRONG') {
          target = document.createElement('span')
          target.innerHTML = priorEl.innerHTML
          priorEl.replaceWith(target)
        } else if (priorEl?.tagName === 'A') {
          target = priorEl
        } else {
          target = parent
        }
        if (parsed.id) target.id = parsed.id
        if (parsed.class) parsed.class.split(' ').forEach(c => target.classList.add(c))
        if (parsed.style) target.setAttribute('style', parsed.style)
        codeWrapper.remove()
      }
    }
  }
}

function hasTimestamp(s:string) { return /\d{1,2}:\d{1,2}/.test(s) }

export function structureContent() {
  let main = document.querySelector('main') as HTMLElement
  let restructured = document.createElement('main')
  restructured.className = 'page-content markdown-body'
  restructured.setAttribute('aria-label', 'Content')
  restructured.style.display = 'none'
  let currentSection: HTMLElement = restructured;
  let sectionParam: HTMLElement | null

  // Converts empty headings (changed to paragraphs by markdown converter) to headings with the correct level
  if (main)
    (Array.from(main?.querySelectorAll('p') as NodeListOf<HTMLElement>) as HTMLParagraphElement[])
    .filter(p => /^#{1,6}$/.test(p.childNodes.item(0).nodeValue?.trim() || ''))
    .forEach(p => {
      let ptext = p.childNodes.item(0).nodeValue?.trim()
      let codeEl = p.querySelector('code') as HTMLElement
      let heading = document.createElement(`h${ptext?.length}`)
      p.replaceWith(heading)
      if (codeEl) {
        let codeWrapper = document.createElement('p')
        codeWrapper.appendChild(codeEl)
        heading.parentElement?.insertBefore(codeWrapper, heading.nextSibling)
      }
    });

  (Array.from(main?.children || []) as HTMLElement[]).forEach((el:HTMLElement) => {
    if (el.tagName[0] === 'H' && isNumeric(el.tagName.slice(1))) {
      let heading = el as HTMLHeadingElement
      let sectionLevel = parseInt(heading.tagName.slice(1))
      if (currentSection) {
        (Array.from(currentSection.children) as HTMLElement[])
          .filter(child => !/^H\d/.test(child.tagName))
          .filter(child => !/PARAM/.test(child.tagName))
          .filter(child => !/STYLE/.test(child.tagName))
          .forEach((child:HTMLElement, idx:number) => { 
            let segId = `${currentSection.getAttribute('data-id') || 1}.${idx+1}`
            child.setAttribute('data-id', segId)
            child.id = segId
            child.className = 'segment'
          })
      }

      currentSection = document.createElement('section')
      currentSection.classList.add(`section${sectionLevel}`)
      Array.from(heading.classList).forEach(c => currentSection.classList.add(c))
      heading.className = ''
      if (heading.id) {
        currentSection.id = heading.id
        heading.removeAttribute('id')
      }

      currentSection.innerHTML += heading.outerHTML

      let headings = [...restructured.querySelectorAll(`H${sectionLevel-1}`)]
      let parent = sectionLevel === 1 || headings.length === 0 ? restructured : headings.pop()?.parentElement as HTMLElement
      parent?.appendChild(currentSection)
      currentSection.setAttribute('data-id', computeDataId(currentSection))

    } else {
      if (el !== sectionParam) currentSection.innerHTML += el.outerHTML
    }
  });

  (Array.from(restructured?.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>) as HTMLHeadingElement[])
  .filter(heading => !heading.innerHTML.trim())
  .forEach(heading => heading.remove());

  (Array.from(restructured?.querySelectorAll('p') as NodeListOf<HTMLElement>) as HTMLParagraphElement[])
  .forEach(para => {
    let lines = para.textContent?.split('\n').map(l => l.trim()) || []
    let codeEl = para.querySelector('code') as HTMLElement
    if (codeEl) lines = lines.slice(0,-1)
    // console.log(lines)
    if (lines.length > 1 && hasTimestamp(lines[0])) {
      para.setAttribute('data-head', lines[0])
      if (lines.length > 2) para.setAttribute('data-qids', lines[2])
      if (lines.length > 3) para.setAttribute('data-related', lines[3])
      para.innerHTML = lines[1]
      if (codeEl) para.appendChild(codeEl)
    }
  });

  (Array.from(restructured?.querySelectorAll('code') as NodeListOf<HTMLElement>) as HTMLElement[])
  .forEach(codeEl => handleCodeEl(codeEl));

  restructured.querySelectorAll('section').forEach((section:HTMLElement) => {
    if (section.classList.contains('cards') && !section.classList.contains('wrapper')) {
      section.classList.remove('cards')
      let wrapper = document.createElement('section')
      wrapper.className = 'cards wrapper'
      Array.from(section.children).slice(1).forEach(card => {
        wrapper.appendChild(card)
        card.classList.add('card')
        let heading = card.querySelector('h1, h2, h3, h4, h5, h6') as HTMLHeadingElement
        if (heading) heading.remove()
        let img = card.querySelector('p > img') as HTMLImageElement
        if (img) img.parentElement?.replaceWith(img)
        let link = card.querySelector('p > a') as HTMLImageElement
        if (link) link.parentElement?.replaceWith(link)
      })
      section.appendChild(wrapper)
    }
    /*
    if (section.classList.contains('tabs')) {
      (Array.from(section.querySelectorAll(':scope > section') as NodeListOf<HTMLElement>) as HTMLElement[])
      .forEach((tabSection:HTMLElement, idx:number) => {
        let input = document.createElement('input')
        input.classList.add(`tab${idx+1}`)
        input.setAttribute('id', `tab${idx+1}`)
        input.setAttribute('type', 'radio')
        input.setAttribute('name', 'tabs')
        if (idx === 0) input.setAttribute('checked', '')
        let label = document.createElement('label')
        label.setAttribute('for', `tab${idx+1}`)
        label.innerHTML = tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.innerHTML || ''
        section.insertBefore(label, section.children.item(idx*2))
        section.insertBefore(input, section.children.item(idx*2))

        tabSection.classList.add('tab')
        tabSection.classList.add(`content${idx+1}`)
      })
    }
    */
    if (section.classList.contains('tabs')) {
      let tabGroup = document.createElement('sl-tab-group');
      (Array.from(section.classList).forEach(cls => tabGroup.classList.add(cls)));
      (Array.from(section.attributes).forEach(attr => tabGroup.setAttribute(attr.name, attr.value)));
      (Array.from(section.querySelectorAll(':scope > section') as NodeListOf<HTMLElement>) as HTMLElement[])
      .forEach((tabSection:HTMLElement, idx:number) => {
        let tab = document.createElement('sl-tab')
        tab.setAttribute('slot', 'nav')
        tab.setAttribute('panel', `tab${idx+1}`)
        tab.innerHTML = tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.innerHTML || ''
        tabGroup.appendChild(tab)      
      });
      (Array.from(section.querySelectorAll(':scope > section') as NodeListOf<HTMLElement>) as HTMLElement[])
      .forEach((tabSection:HTMLElement, idx:number) => {
        let tabPanel = document.createElement('sl-tab-panel')
        tabPanel.setAttribute('name', `tab${idx+1}`)
        tabPanel.innerHTML = tabSection.innerHTML || ''
        tabGroup.appendChild(tabPanel)
      })
      section.replaceWith(tabGroup)
    }
    if (section.classList.contains('mcol') && !section.classList.contains('wrapper')) {
      let wrapper = document.createElement('section')
      wrapper.className = 'mcol wrapper'
      section.classList.remove('mcol')
      Array.from(section.children)
        .filter(child => child.tagName === 'SECTION')
        .forEach((col, idz) => {
        wrapper.appendChild(col)
        col.classList.add(`col-${idz+1}`)
      })
      section.appendChild(wrapper)
    }
  });

  restructured.querySelectorAll('a').forEach(anchorElem => {
    let link = new URL(anchorElem.href)
    let path = link.pathname.split('/').filter(p => p)
    if (path[0] === 'zoom') {
      anchorElem.classList.add('zoom')
      anchorElem.setAttribute('rel', 'nofollow')
    }
    if (isGHP && window.config.repo && link.origin === location.origin && link.pathname.indexOf(`/${window.config.repo}/`) !== 0) anchorElem.href = `/${window.config.repo}${link.pathname}`
  })

  Array.from(restructured.querySelectorAll('img'))
    .forEach((img: HTMLImageElement) => {
      if (img.parentElement?.classList.contains('card')) return
      let ezImage = document.createElement('ez-image')
      ezImage.setAttribute('src', img.src)
      ezImage.setAttribute('alt', img.alt)
      ezImage.setAttribute('left', '');
      (img.parentNode as HTMLElement).replaceWith(ezImage)
    })

  computeStickyOffsets(restructured)

  restructured.style.paddingBottom = '100vh'
  main?.replaceWith(restructured)

  return main
}

function computeStickyOffsets(root:HTMLElement) {
  function topIsVisible(el:HTMLElement) {
    let bcr = el.getBoundingClientRect()
    return bcr.top >= 0 && bcr.top <= window.innerHeight
  }
  let stickyElems = [
    ...(Array.from(root.querySelectorAll('ez-header[sticky], ez-breadcrumbs[sticky]') as NodeListOf<HTMLElement>) as HTMLElement[]),
    ...(Array.from(root.querySelectorAll('.sticky') as NodeListOf<HTMLElement>) as HTMLElement[])
  ]
  .filter(stickyEl => {
    // console.log(stickyEl, topIsVisible(stickyEl))
    return topIsVisible(stickyEl)
  })
  .sort((a,b) => {
      let aTop = a.getBoundingClientRect().top
      let bTop = b.getBoundingClientRect().top
      return aTop < bTop ? -1 : 1
    })
  
  console.log('computeStickyOffsets', stickyElems.length)

  // nextTick(() => stickyElems.forEach(stickyEl => console.log(stickyEl.getBoundingClientRect()) ))
  // nextTick(() => stickyElems.forEach(stickyEl => console.log(stickyEl) ))

  if (stickyElems.length === 1) {
    stickyElems[0].style.top = '0px'
  } else if (stickyElems.length > 1) {
    nextTick(() => {
      for (let i = 1; i < stickyElems.length; i++) {
        let top = 0
        let bcr1 = stickyElems[i].getBoundingClientRect()
        let left1 = bcr1.x
        let right1 = bcr1.x + bcr1.width
        for (let j = 0; j < i; j++) {
          let bcr2 = stickyElems[j].getBoundingClientRect()
          let left2 = bcr2.x
          let right2 = bcr2.x + bcr2.width
          if ((left1 <= right2) && (right1 >= left2)) {
            top += stickyElems[j].getBoundingClientRect().height
          }
        }
        stickyElems[i].style.top = `${Math.floor(top)}px`
      }
    })
  }
}

function loadDependency(dependency, callback) {
  let e = document.createElement(dependency.tag)
  Object.entries(dependency).forEach(([k, v]) => { if (k !== 'tag') e.setAttribute(k, v) })
  e.addEventListener('load', callback)
  if (dependency.tag === 'script') document.body.appendChild(e)
  else document.head.appendChild(e)
}

export function loadDependencies(dependencies:any[], callback:any = null, i:number = 0) {
  loadDependency(dependencies[i], () => {
    if (i < dependencies.length-1) loadDependencies(dependencies, callback, i+1) 
    else if (callback) callback()
  })
}

let activeParagraph: HTMLElement

let visibleParagraphs: IntersectionObserverEntry[] = []
export function observeVisible(callback:any = null) {

  let topMargin = 0;
  (Array.from(document.querySelectorAll('.sticky') as NodeListOf<HTMLElement>) as HTMLElement[])
  .filter(sticklEl => sticklEl.getBoundingClientRect().x < 600)
  .forEach(stickyEl => topMargin += stickyEl.getBoundingClientRect().height)

  const observer = new IntersectionObserver((entries, observer) => {
    let notVisible = entries.filter(entry => !entry.isIntersecting)
    for (const entry of entries) { if (entry.isIntersecting && !visibleParagraphs.find(vp => vp.target === entry.target)) visibleParagraphs.push(entry) }

    visibleParagraphs = visibleParagraphs
      .filter(entry => notVisible.find(nv => nv.target === entry.target) ? false : true)
      .filter(entry => entry.target.getBoundingClientRect().x < 600)
      .filter(entry => entry.target.classList.contains('sticky') ? false : true)

    visibleParagraphs = visibleParagraphs
      .sort((a,b) => {
        let aTop = a.target.getBoundingClientRect().top
        let bTop = b.target.getBoundingClientRect().top
        return aTop < bTop ? -1 : 1
      })
      // .sort((a,b) => { return a.intersectionRatio > b.intersectionRatio ? -1 : 1 })
    // console.log(`visibleParagraphs: ${visibleParagraphs.length}`)
    // visibleParagraphs.forEach(entry => console.log(entry.target))

    if (activeParagraph !== visibleParagraphs[0]?.target) {
      activeParagraph = visibleParagraphs[0]?.target as HTMLElement
      // console.log('activeParagraph', activeParagraph)
      document.querySelectorAll('p.active').forEach(p => p.classList.remove('active'))
      activeParagraph?.classList.add('active')
      computeStickyOffsets(document.querySelector('main') as HTMLElement)
    }
  }, { root: null, threshold: [1.0, .5], rootMargin: `${topMargin ? -topMargin : 0}px 0px 0px 0px`})

  // target the elements to be observed
  document.querySelectorAll('p').forEach((paragraph) => observer.observe(paragraph))
}

////////// Wikidata Entity functions //////////

let entityData:any = {}
export async function getEntityData(qids: string[] = [], language: string = 'en') {
  let values = qids.filter(qid => !entityData[qid]).map(qid => `(<http://www.wikidata.org/entity/${qid}>)`)
  if (values.length > 0) {
    let query = `
      SELECT ?item ?label ?description ?alias ?image ?logoImage ?coords ?pageBanner ?whosOnFirst ?wikipedia WHERE {
        VALUES (?item) { ${values.join(' ')} }
        ?item rdfs:label ?label . 
        FILTER (LANG(?label) = "${language}" || LANG(?label) = "en")
        OPTIONAL { ?item schema:description ?description . FILTER (LANG(?description) = "${language}" || LANG(?description) = "en")}
        OPTIONAL { ?item skos:altLabel ?alias . FILTER (LANG(?alias) = "${language}" || LANG(?alias) = "en")}
        OPTIONAL { ?item wdt:P625 ?coords . }
        OPTIONAL { ?item wdt:P18 ?image . }
        OPTIONAL { ?item wdt:P154 ?logoImage . }
        OPTIONAL { ?item wdt:P948 ?pageBanner . }
        OPTIONAL { ?item wdt:P6766 ?whosOnFirst . }
        OPTIONAL { ?wikipedia schema:about ?item; schema:isPartOf <https://${language}.wikipedia.org/> . }
    }`
    let resp = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json'
      },
      body: `query=${encodeURIComponent(query)}`
    })
    if (resp.ok) {
      let sparqlResp = await resp.json()
      sparqlResp.results.bindings.forEach((rec: any) => {
        let qid = rec.item.value.split('/').pop()
        if (!entityData[qid]) {
          entityData[qid] = {id: qid, label: rec.label.value}
          if (rec.description) entityData[qid].description = rec.description.value
          if (rec.alias) entityData[qid].aliases = [rec.alias.value]
          if (rec.coords) entityData[qid].coords = rec.coords.value.slice(6,-1).split(' ').reverse().join(',')
          if (rec.wikipedia) entityData[qid].wikipedia = rec.wikipedia.value
          if (rec.pageBanner) entityData[qid].pageBanner = rec.pageBanner.value
          if (rec.image) {
            entityData[qid].image = rec.image.value
            entityData[qid].thumbnail = mwImage(rec.image.value, 300)
          }
          if (rec.logoImage) {
            entityData[qid].logoImage = rec.logoImage.value
            if (!entityData[qid].thumbnail) entityData[qid].thumbnail = mwImage(rec.logoImage.value, 300)
          }
          if (rec.whosOnFirst) entityData[qid].geojson = whosOnFirstUrl(rec.whosOnFirst.value)
        } else {
          if (rec.alias) entityData[qid].aliases.push(rec.alias.value)
        }
      })
      // return entityData
      return Object.fromEntries(qids.filter(qid => entityData[qid]).map(qid => [qid,entityData[qid]]))
    }
  }
  // return entityData
  return Object.fromEntries(qids.filter(qid => entityData[qid]).map(qid => [qid,entityData[qid]]))
}

export function mwImage(mwImg:string, width:number) {
  // Converts Wikimedia commons image URL to a thumbnail link
  mwImg = (Array.isArray(mwImg) ? mwImg[0] : mwImg).replace(/Special:FilePath\//, 'File:').split('File:').pop()
  mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
  const _md5 = Md5.hashStr(mwImg)
  const extension = mwImg.split('.').pop()
  let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
  url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
  if (width) {
    url += `/${width}px-${mwImg}`
    if (extension === 'svg') {
      url += '.png'
    } else if (extension === 'tif' || extension === 'tiff') {
      url += '.jpg'
    }
  }
  return url
}

// Creates a GeoJSON file URL from a Who's on First ID 
function whosOnFirstUrl(wof:string) {
  let wofParts:string[] = []
  for (let i = 0; i < wof.length; i += 3) {
    wofParts.push(wof.slice(i,i+3))
  }
  return `https://data.whosonfirst.org/${wofParts.join('/')}/${wof}.geojson`
}

// For cropping regular images
export async function imageDataUrl(url: string, region: any, dest: any): Promise<string> {
  return new Promise((resolve) => {
    let {x, y, w, h} = region
    let {width, height} = dest
    let image = new Image()
    image.crossOrigin = 'anonymous'
    x = x ? x/100 : 0
    y = y ? y/100 : 0
    w = w ? w/100 : 0
    h = h ? h/100 : 0
    image.onload = () => {
      let sw = image.width
      let sh = image.height
      let swScaled = w > 0 ? sw * w : sw - (sw * x)
      let shScaled =  h > 0 ? sh * h : sh - (sh * y)
      let ratio = swScaled/shScaled
      if (ratio > 1) height = width/ratio
      else width = height * ratio
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = width
      canvas.height = height
      x = x*sw
      y = y*sh
      ctx?.drawImage(image, x, y, swScaled, shScaled, 0, 0, width, height)
      let dataUrl = canvas.toDataURL()
      resolve(dataUrl)
    }
    image.src = url
  })
}

export async function getEntity(qid: string, language: string = 'en') {
  let entities = await getEntityData([qid], language)
  return entities[qid]
}

////////// IIIF functions //////////

function _findItems(toMatch: object, current: any, found: object[] = []) {
  found = found || []
  if (current.items) {
    for (let i = 0; i < current.items.length; i++ ) {
      let item = current.items[i]
      let isMatch = !Object.entries(toMatch).find(([attr, val]) => item[attr] && item[attr] !== val)
      if (isMatch) found.push(item)
      else _findItems(toMatch, item, found)
    }
  }
  return found
}

export function findItem(toMatch: object, current: object, seq: number = 1): any {
  const found = _findItems(toMatch, current)
  return found.length >= seq ? found[seq-1] : null
}

export function getItemInfo(manifest:any, seq=1) {
  let _itemInfo = findItem({type:'Annotation', motivation:'painting'}, manifest, seq).body
  // if (_itemInfo.service) _itemInfo.service = _itemInfo.service.map((svc:any) => ({...svc, ...{id: (svc.id || svc['@id']).replace(/\/info\.json$/,'')}}))
  return _itemInfo
}

export function parseImageOptions(str: string) {
  let elems = str?.split('/') || []
  // let seq = 1
  let region = 'full'
  let size = 'full'
  let rotation = '0'
  let quality = 'default'
  let format = 'jpg'
  let offset = 0
  /*
  if (isNum(elems[0])) {
    seq = +elems[0]
    offset = 1
  }
  */
  let options = {
    // seq,
    region: elems.length > offset && elems[offset] ? elems[offset] : region,
    size: elems.length > offset+1 && elems[offset+1] ? elems[offset+1] : size,
    rotation: elems.length > offset+2 && elems[offset+2] ? elems[offset+2] : rotation,
    quality: elems.length > offset+3 && elems[offset+3] ? elems[offset+3] : quality,
    format: elems.length > offset+4 && elems[offset+4] ? elems[offset+4] : format
  }
  return options
}

const _manifestCache:any = {}
export async function loadManifests(manifestUrls: string[], refresh: boolean=false) {
  let _manifestUrls = manifestUrls
  .map(manifestId =>
    manifestId.indexOf('http') === 0
      ? manifestId
      : `${iiifServer}/${manifestId}/manifest.json`
  )
  let toGet = _manifestUrls.filter(url => !_manifestCache[url])

  if (toGet.length > 0) {
    let requests: any = toGet
      .map(manifestUrl => {
        if (refresh && ['localhost', 'iiif.juncture-digital.org'].includes(new URL(manifestUrl).hostname)) {
          manifestUrl += '?refresh'
        }
        return fetch(manifestUrl)
      })
    let responses = await Promise.all(requests)
    let manifests = await Promise.all(responses.map((resp:any) => resp.json()))
    requests = manifests
      .filter(manifest => !Array.isArray(manifest['@context']) && parseFloat(manifest['@context'].split('/').slice(-2,-1).pop()) < 3)
      .map(manifest => fetch('https://iiif.juncture-digital.org/prezi2to3/', {
        method: 'POST', 
        body: JSON.stringify(manifest)
      }))
    if (requests.length > 0) {
      responses = await Promise.all(requests)
      let convertedManifests = await Promise.all(responses.map((resp:any) => resp.json()))
      for (let i = 0; i < manifests.length; i++) {
        let mid =  manifests[i].id ||manifests[i]['@id']
        let found = convertedManifests.find(manifest => (manifest.id || manifest['@id']) === mid)
        if (found) manifests[i] = found
      }
    }
    manifests.forEach((manifest, idx) => _manifestCache[toGet[idx]] = manifest)
    return _manifestUrls.map(url => _manifestCache[url])
  } else {
    return _manifestUrls.map(url => _manifestCache[url])
  }
}

export async function getManifest(manifestId: string, refresh: boolean=false) {
  let manifestUrl = manifestId.indexOf('http') === 0
    ? manifestId
    : `${iiifServer}/${manifestId}/manifest.json`
  let manifests = await loadManifests([manifestUrl], refresh)
  return manifests[0]
}
