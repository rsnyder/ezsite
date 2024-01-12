import { marked } from 'marked'
import { nextTick } from 'vue'

export const iiifServer = 'https://iiif.juncture-digital.org'

marked.use({
  walkTokens(token: any) {
    const { type, raw } = token
    /*
    if (type === 'paragraph' && (raw.startsWith('.ez-'))) {
      token.type = 'code'
      token.lang = 'juncture'
    }
    */
  },
  renderer: {
    paragraph(paraText) {

      // if (paraText.startsWith('<img')) return imgHandler(paraText)

      let fnRefs = Array.from(paraText.matchAll(/(\[\^(\w+)\])([^:]|\s|$)/g))        // footnote references
      let markedText = Array.from(paraText.matchAll(/==(.+?)==\{([^\}]+)/g))  // marked text
      if (fnRefs.length || markedText.length) {
        paraText = footnoteReferencesHandler(paraText)
        paraText = markedTextHandler(paraText)
        return `<p>${paraText}</p>`
      }

      let fns = Array.from(paraText.matchAll(/(\[\^(\w+)\]:)/g))              // footnotes
      if (fns.length) {
        return `<ol style="margin-left:-1rem;">${footnotesHandler(paraText)}</ol>`
      }
      
      return false // Use default renderer
    
    },
    code(code, language) {
      if (language === 'juncture') {
        let lines = code.trim().split('\n')
        let headLine = lines[0]
        let tag = headLine.match(/\.ez-[^\W]+/)?.[0].slice(1)
        let attrs = asAttrs(parseHeadline(headLine))
        let slot = lines.length > 1 ? marked.parse(lines.slice(1).map(l => l.replace(/^    /,'')).join('\n')) : ''
        let elemHtml = `<${tag} ${attrs}>\n${slot}</${tag}>`
        return elemHtml
      }
      return false // Use default code renderer.
    }

  }
})

export function isURL(str:string) { return /^https*:\/\//.test(str) }

const isGHP = /\.github\.io$/.test(location.hostname)

export function ezComponentHtml(el:HTMLElement) {
  let lines = el.textContent?.trim().split('\n') || []
  if (lines.length === 0) return ''
  let headLine = lines[0]
  let tag = headLine.match(/ez-[^\W]+/)?.[0]
  let attrs = asAttrs(parseHeadline(headLine))
  let slot = lines.length > 1 ? marked.parse(lines.slice(1).map(l => l.replace(/^    /,'')).join('\n')) : ''
  let elemHtml = `<${tag} ${attrs}>\n${slot}</${tag}>`
  return elemHtml
}

function markedTextHandler(paraText: string) {
  let markedText = paraText.matchAll(/==(.+?)==\{([^\}]+)/g)
  let segments:string[] = []
  let start = 0
  for (const match of markedText) {
    segments.push(paraText.slice(start, match.index))
    let [all, text, attrStr] = match
    let attrs = parseAttrsStr(attrStr)
    let tag = attrs.qid ? 'ez-entity-infobox' : 'ez-trigger'
    segments.push(`<${tag} ${asAttrs(attrs)}>${text}</${tag}>`)
    start = (match.index || 0) + all.length + 1
  }
  segments.push(paraText.slice(start))
  return segments.join('')
}

function footnoteReferencesHandler(paraText:string) { // TODO - Handle multiple references to the same footnote
  let segments:string[] = []
  let start = 0
  Array.from(paraText.matchAll(/(\[\^(\w+)\])([^:]|\s|$)/g)).forEach(match => {
    segments.push(paraText.slice(start, match.index))
    let [all, group, fnRef] = match
    segments.push(`<sup><a id="fnRef:${fnRef}" href="#fn:${fnRef}" style="font-weight:bold;padding:0 3px;">${fnRef}</a></sup>`)
    start = (match.index || 0) + group.length
  })
  segments.push(paraText.slice(start))
  return segments.join('')
}

function footnotesHandler(paraText:string) { // TODO - Handle multiple references to the same footnote
  let footnotes:string[] = []
  let start = 0
  let backLink:string = ''
  let fnRef:string = ''
  Array.from(paraText.matchAll(/(\[\^(\w+)\]:)/g)).forEach(match => {
    let [all, _, _fnRef] = match
    if (backLink) {
      let text = paraText.slice(start, match.index).trim()
      footnotes.push(`<li id="fn:${fnRef}" role="doc-endnote"><p>${text}${backLink}</p></li>`)
    }
    backLink = `<a href="#fnRef:${_fnRef}" title="Jump back to footnote ${_fnRef} in the text" class="reversefootnote" role="doc-backlink" style="margin-left:6px;text-decoration:none;">↩</a>`
    fnRef = _fnRef
    start = (match.index || 0) + all.length + 1
  })
  let text = paraText.slice(start).trim()
  footnotes.push(`<li id="fn:${fnRef}" role="doc-endnote"><p>${text}${backLink}</p></li>`)
  return footnotes.join('')
}

function imgHandler(paraText:string) {
  let match = paraText.match(/(<img.+>)\s*{?([^\}]+)?/) || []
  let [_, imgStr, attrStr] = match
  let img:any = new DOMParser().parseFromString(imgStr, 'text/html').children[0].children[1].children[0]
  let attrs = parseAttrsStr(attrStr)
  if (!attrs.full && !attrs.right) attrs.left = 'true'
  return `<ez-image src="${img.src}" ${asAttrs(attrs)}></ez-image>`
}

function parseHeadline(s:string) {
  let tokens:string[] = []
  s = s.replace(/”/g,'"').replace(/”/g,'"').replace(/’/g,"'")
  s?.match(/[^\s"]+|"([^"]*)"/gmi)?.forEach((token:string) => {
    if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
    else tokens.push(token)
  })
  return Object.fromEntries(tokens.slice(1).map(token => {
    if (token.indexOf('=') > 0) {
      let [key, value] = token.split('=')
      return [key, value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value]
    } else return [token, "true"]
  }))
}

function asAttrs(obj:any) {
  return Object.entries(obj).map(([k, v]) => v === 'true' ? k : `${k}="${v}"`).join(' ')
}

function isQid(s:string) { return /^Q\d+$/.test(s) }
function isCoords(s:string) { return /^[+-]?\d+(.\d*|\d*),{1}[+-]?\d+(.\d*|\d*)$/.test(s) }

function parseAttrsStr(s: string): any {
  if (!s) return {}
  let tokens:string[] = []
  s = s.replace(/“/g,'"').replace(/”/g,'"').replace(/’/g,"'")
  s?.match(/[^\s"]+|"([^"]*)"/gmi)?.forEach(token => {
    if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
    else tokens.push(token)
  })
  let obj:any = {}
  let classes = new Set()
  tokens.forEach(token => {
    if (token[0] === '#') obj.id = token.slice(1)
    else if (token[0] === '.') classes.add(token.slice(1))
    else if (token.indexOf('=') > 0) {
      let [key, value] = token.split('=')
      if (key === 'class') value.split(',').forEach(c => classes.add(c))
      else obj[key] = value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value
    }
    else if (isQid(token)) obj.qid = token
    else if (isCoords(token)) obj.zoomto = token
    else obj[token] = "true"
  })
  if (classes.size > 0) obj.class = Array.from(classes).join(' ')
  return obj
}

export function md2html(markdown: string) {
  return marked.parse(markdown)
}

async function getHeaderHtml() {
  let resp = await fetch('/_includes/header.html')
  if (resp.ok) return await resp.text()
}

async function getFooterHtml() {
  let resp = await fetch('/_includes/footer.html')
  if (resp.ok) return await resp.text()
}

export async function getConfig() {
  let configExtras: any = {}
  let baseurl = window?.config?.baseurl || `/${location.pathname.split('/')[1]}`
  const configUrls = [
    location.hostname === 'localhost' ? 'http://localhost:8080/config.yml' : `${baseurl}/config.yml`,
    location.hostname === 'localhost' ? 'http://localhost:8080/ezsite/default_config.yml' : `${baseurl}/ezsite/default_config.yml`
  ]
  for (const configUrl of configUrls) {
    let resp = await fetch(configUrl)
    if (resp.ok) configExtras = window.jsyaml.load(await resp.text())
    if (resp.ok) break
  }
  window.config = {
    ...window.config,
    ...configExtras,
    meta: setMeta(),
    isGHP, 
    baseurl
  }
  if (isGHP) {
    if (!window.config.owner) window.config.owner = location.hostname.split('.')[0]
    if (!window.config.repo) window.config.repo = location.pathname.split('/')[1]
  }
  return window.config
}

function setMeta() {
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
    : header?.getAttribute('title')
      ? header.getAttribute('title')
      : firstHeading || ''

  let description =  meta?.getAttribute('description')
    ? meta.getAttribute('description')
    : firstParagraph || ''

  let robots =  meta?.getAttribute('robots') || (location.hostname.indexOf('www') === 0 ? '' : 'noindex, nofollow')

  if (title) {
    document.title = title
    seo.name = title
    seo.headline = title
  }
  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
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

  return({title, description, robots, seo})
}

export async function getHtml() {
    
  let path = location.pathname.split('/').filter(p => p)
  let branch = 'main'
  let owner: string = '', 
      repo: string = '', 
      resp: Response

  owner = config.owner
  repo = config.repo

  if (path.length === 0) path = ['README.md']

  let contentUrl = location.hostname === 'localhost'
    ? `${location.origin}/${path}`
    : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`

  let rawText, markdown
  resp = await fetch(contentUrl)
  if (resp.ok) {
    let rawText = await resp.text()
    if (rawText.indexOf('<!DOCTYPE html>') < 0) markdown = rawText
  } 
  if (!markdown && !/\.md$/.test(contentUrl)) {
    contentUrl += '.md'
    resp = await fetch(contentUrl)
    if (resp.ok) {
      rawText = await resp.text()
      if (rawText.indexOf('<!DOCTYPE html>') < 0) markdown = rawText
    }
    if (!markdown) {
      contentUrl = contentUrl.replace(/\.md$/, '/README.md')
      resp = await fetch(contentUrl)
      if (resp.ok) {
        rawText = await resp.text()
        if (rawText.indexOf('<!DOCTYPE html>') < 0) markdown = rawText
      }      
    }
  }
  if (markdown) {
    let headerHtml = (await getHeaderHtml() || '').replace(/\{\{\s*site\.baseurl\s*\}\}/g, '/')
    let footerHtml = await getFooterHtml() || ''
    let el:HTMLElement = new DOMParser().parseFromString(md2html(markdown), 'text/html').children[0].children[1] as HTMLElement
    let html = `
      ${headerHtml}
      <main class="page-content" aria-label="Content">${el.innerHTML}</main>
      ${footerHtml}
    `
    return html
  }
}

export async function convertToEzElements(el:HTMLElement) {
  el.querySelectorAll('a').forEach(anchorElem => {
    let link = new URL(anchorElem.href)
    let path = link.pathname.split('/').filter(p => p)
    if (path[0] === 'zoom') {
      anchorElem.classList.add('zoom')
      anchorElem.setAttribute('rel', 'nofollow')
    }
    if (isGHP && config.repo && link.origin === location.origin && link.pathname.indexOf(`/${config.repo}/`) !== 0) anchorElem.href = `/${config.repo}${link.pathname}`
  })

  Array.from(el.querySelectorAll('img'))
    .forEach((img: HTMLImageElement) => {
      if (img.parentElement?.classList.contains('card')) return
      let ezImage = document.createElement('ez-image')
      ezImage.setAttribute('src', img.src)
      ezImage.setAttribute('alt', img.alt)
      ezImage.setAttribute('left', '');
      (img.parentNode as HTMLElement).replaceWith(ezImage)
    })

  /*
  Array.from(el.querySelectorAll('p'))
    .filter((p: HTMLParagraphElement) => /^\.ez-/.test(p.textContent || ''))
    .forEach((p: HTMLParagraphElement) => {
      let ezComponent = new DOMParser().parseFromString(ezComponentHtml(p), 'text/html').children[0].children[1].children[0]
      p.parentNode?.replaceChild(ezComponent, p)
    })
  */

  Array.from(el.querySelectorAll('blockquote'))
  .filter((blockquote: HTMLQuoteElement) => /^\s*ez-\S+/.test(blockquote.textContent || ''))
  .forEach((blockquote: HTMLQuoteElement) => {
    let p = blockquote.querySelector('p') as HTMLParagraphElement
    let ul = blockquote.querySelector('ul') as HTMLUListElement
    let ezComponent = new DOMParser().parseFromString(ezComponentHtml(p), 'text/html').children[0].children[1].children[0]
    if (ul) ezComponent.appendChild(ul)
    blockquote.parentNode?.replaceChild(ezComponent, blockquote)
  })
    
}

function isNumeric(arg:any) { return !isNaN(arg) }

function computeDataId(el:HTMLElement) {
  let dataId: number[] = []
  // if (!el.parentElement) dataId.push(1)
  while (el.parentElement) {
    let siblings: HTMLElement[] = Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName) as HTMLElement[]
    dataId.push(siblings.indexOf(el) + 1)
    el = el.parentElement
  }
  return dataId.reverse().join('.')
}

export function structureContent() {
  let main = document.querySelector('main') as HTMLElement
  let restructured = document.createElement('main')
  let currentSection: HTMLElement = restructured;
  let sectionParam: HTMLElement | null

  // Converts empty headings (changed to paragraphs by markdown converter) to headings with the correct level
  if (main)
  (Array.from(main?.querySelectorAll('p') as NodeListOf<HTMLElement>) as HTMLElement[])
  .filter(p => /^#{1,6}$/.test(p.textContent || ''))
  .forEach(p => p.replaceWith(document.createElement(`h${p.textContent?.length}`)));

  (Array.from(main?.children || []) as HTMLElement[]).forEach((el:HTMLElement) => {
    if (el.tagName[0] === 'H' && isNumeric(el.tagName.slice(1))) {
      let heading = el as HTMLHeadingElement
      let sectionLevel = parseInt(heading.tagName.slice(1))
      if (currentSection) {
        (Array.from(currentSection.children) as HTMLElement[])
          .filter(child => !/^H\d/.test(child.tagName))
          .filter(child => !/PARAM/.test(child.tagName))
          .forEach((child:HTMLElement, idx:number) => { 
            let segId = `${currentSection.getAttribute('data-id') || 1}.${idx+1}`
            child.setAttribute('data-id', segId)
            child.id = segId
            child.className = 'segment'
          })
      }

      currentSection = document.createElement('section')
      currentSection.classList.add(`section-${sectionLevel}`)
      Array.from(heading.classList).forEach(c => currentSection.classList.add(c))
      sectionParam = heading.nextElementSibling?.tagName === 'PARAM'
        ? heading.nextElementSibling as HTMLElement
        : null
      if (sectionParam) {
        sectionParam.classList.forEach(c => currentSection.classList.add(c))
      }
      heading.className = ''
      if (heading.id) {
        currentSection.id = heading.id
        heading.removeAttribute('id')
      }

      currentSection.innerHTML += heading.outerHTML
      // if (!heading.innerHTML.trim()) currentSection.firstChild?.remove()

      let headings = [...restructured.querySelectorAll(`H${sectionLevel-1}`)]
      let parent = sectionLevel === 1 || headings.length === 0 ? restructured : headings.pop()?.parentElement as HTMLElement
      parent?.appendChild(currentSection)
      currentSection.setAttribute('data-id', computeDataId(currentSection))

    } else {
      if (el !== sectionParam) currentSection.innerHTML += el.outerHTML
    }
  })

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
  });

  (Array.from(restructured?.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>) as HTMLHeadingElement[])
  .filter(heading => !heading.innerHTML.trim())
  .forEach(heading => heading.remove());

  (Array.from(restructured?.querySelectorAll('param') as NodeListOf<HTMLElement>) as HTMLParamElement[])
  .forEach(param => {
    param.classList.forEach(c => (param.previousSibling as HTMLElement)?.classList.add(c))
    if (param.id) (param.previousSibling as HTMLElement).id = param.id
    param.remove();
  });

  (Array.from(restructured?.querySelectorAll('p') as NodeListOf<HTMLElement>) as HTMLParagraphElement[])
  .forEach(para => {
    let lines = para.textContent?.split('\n').map(l => l.trim()) || []
    if (lines.length > 1) {
      para.setAttribute('data-head', lines[0])
      if (lines.length > 2) para.setAttribute('data-qids', lines[2])
      if (lines.length > 3) para.setAttribute('data-related', lines[3])
      para.innerHTML = lines[1]
    }
  });

  convertToEzElements(restructured)

  let stickyHeader = restructured.querySelector('ez-header[sticky]')
  let stickyElems = Array.from(restructured?.querySelectorAll('.sticky') as NodeListOf<HTMLElement>) as HTMLElement[]
  if (stickyHeader) {
    nextTick(() => {
      let headerHeight = stickyHeader.getBoundingClientRect().height;
      stickyElems.forEach(stickyEl => stickyEl.style.top = `${headerHeight}px`)  
    })
  }

  restructured.style.paddingBottom = '100vh'
  main?.replaceWith(restructured)

  return main

}

export function loadDependencies(dependencies:any[], callback:any = null, i:number = 0) {
  loadDependency(dependencies[i], () => {
    if (i < dependencies.length-1) loadDependencies(dependencies, callback, i+1) 
    else if (callback) callback()
  })
}

function loadDependency(dependency, callback) {
  let e = document.createElement(dependency.tag)
  Object.entries(dependency).forEach(([k, v]) => { if (k !== 'tag') e.setAttribute(k, v) })
  e.addEventListener('load', callback)
  if (dependency.tag === 'script') document.body.appendChild(e)
  else document.head.appendChild(e)
}

export async function getEntity(qid: string, language: string = 'en') {
  let entities = await getEntityData([qid], language)
  return entities[qid]
}

let entityData:any = {}
export async function getEntityData(qids: string[] = [], language: string = 'en') {
  let values = qids.filter(qid => !entityData[qid]).map(qid => `(<http://www.wikidata.org/entity/${qid}>)`)
  // console.log(`getEntityData: qids=${qids.length} toGet=${values.length}`)
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
      // console.log(`x=${x} y=${y} sw=${sw} sh=${sh} swScaled=${swScaled} shScaled=${shScaled} width=${width} height=${height} ratio=${ratio}`)
      ctx?.drawImage(image, x, y, swScaled, shScaled, 0, 0, width, height)
      let dataUrl = canvas.toDataURL()
      resolve(dataUrl)
    }
    image.src = url
  })
}

export function findItem(toMatch: object, current: object, seq: number = 1): any {
  const found = _findItems(toMatch, current)
  return found.length >= seq ? found[seq-1] : null
}

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

export function getItemInfo(manifest:any, seq=1) {
  // console.log(`itemInfo: seq=${seq}`, manifest)
  let _itemInfo = findItem({type:'Annotation', motivation:'painting'}, manifest, seq).body
  // if (_itemInfo.service) _itemInfo.service = _itemInfo.service.map((svc:any) => ({...svc, ...{id: (svc.id || svc['@id']).replace(/\/info\.json$/,'')}}))
  return _itemInfo
}

export async function getManifest(manifestId: string, refresh: boolean=false) {
  let manifestUrl = manifestId.indexOf('http') === 0
    ? manifestId
    : `${iiifServer}/${manifestId}/manifest.json`
  let manifests = await loadManifests([manifestUrl], refresh)
  return manifests[0]
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
  // console.log('loadManifests', toGet)

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

let visibleParagraphs: IntersectionObserverEntry[] = []
export function observeVisible(callback:any = null) {
  let stickyHeader = document.querySelector('ez-header[sticky]')
  let topMargin = stickyHeader ? -stickyHeader.getBoundingClientRect().height : 0
  const observer = new IntersectionObserver((entries, observer) => {
    let notVisible = entries.filter(entry => !entry.isIntersecting)
    for (const entry of entries) { if (entry.isIntersecting) visibleParagraphs.push(entry) }
    visibleParagraphs = visibleParagraphs
      .filter(entry => notVisible.find(nv => nv.target === entry.target) ? false : true)
      .filter(entry => entry.target.getBoundingClientRect().x < 600)

    visibleParagraphs = visibleParagraphs
      .sort((a,b) => {
        let aTop = a.target.getBoundingClientRect().top
        let bTop = b.target.getBoundingClientRect().top
        return aTop < bTop ? -1 : 1
      })
      .sort((a,b) => {
        return a.intersectionRatio > b.intersectionRatio ? -1 : 1
      })
    document.querySelectorAll('p.active').forEach(p => p.classList.remove('active'))
    visibleParagraphs[0]?.target.classList.add('active')
  }, { root: null, threshold: [1.0, .5], rootMargin: `${topMargin}px 0px 0px 0px`})

  // target the elements to be observed
  document.querySelectorAll('p').forEach((paragraph) => observer.observe(paragraph))
}