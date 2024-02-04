import { isJunctureV1, createJunctureV1App } from 'https://rsnyder.github.io/juncture/index.js'

function isNumeric(arg) { return !isNaN(arg) }
function hasTimestamp(s) { return /\d{1,2}:\d{1,2}/.test(s) }

function computeDataId(el) {
  let dataId = []
  while (el.parentElement) {
    let siblings = Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName)
    dataId.push(siblings.indexOf(el) + 1)
    el = el.parentElement
  }
  return dataId.reverse().join('.')
}

function parseHeadline(s) {
  let tokens = []
  s = s.replace(/”/g,'"').replace(/”/g,'"').replace(/’/g,"'")
  s?.match(/[^\s"]+|"([^"]*)"/gmi)?.filter(t => t).forEach(token => {
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
    else if (/^\w+-[-\w]*\w+$/.test(token) && !parsed.tag) parsed['tag'] = token
    else if (token === 'script' || token === 'link') parsed['tag'] = token
    else {
      if (parsed.tag === 'script' && !parsed.src) parsed.src = token
      else if (parsed.tag === 'link' && !parsed.href) parsed.href= token
      else parsed[token] = true
    }
    tokenIdx++
  }
  return parsed
}

function parseCodeEl(codeEl) {
  let codeElems = codeEl.textContent?.replace(/\s+\|\s+/g,'\n').split('\n').map(l => l.trim()).filter(x => x) || []
  let parsed = parseHeadline(codeElems?.[0]) || {}
  if (codeElems.length > 1) parsed.args = parsed.args ? [...parsed.args, ...codeElems.slice(1)] : codeElems.slice(1)
  return parsed
}

function handleCodeEl(rootEl, codeEl) {
  // (codeEl)
  // console.log(codeEl.parentElement)
  // console.log(codeEl.previousElementSibling)
  
  let parentTag = codeEl.parentElement?.tagName
  let previousElTag = codeEl.previousElementSibling?.tagName
  if (parentTag === 'P' || 
      parentTag === 'PRE' ||
      parentTag === 'LI' ||
      /^H\d/.test(parentTag)) {
  
    let codeWrapper
    if (previousElTag === 'IMG' || previousElTag === 'A' || previousElTag === 'EM' || previousElTag === 'STRONG') codeWrapper = codeEl
    else if (parentTag === 'P') {
      let paraText = Array.from(codeEl.parentElement?.childNodes).map(c => c.nodeValue?.trim()).filter(x => x).join('')
      codeWrapper = paraText ? codeEl : codeEl.parentElement
    } 
    else if (parentTag === 'LI') codeWrapper = codeEl
    else if (/^H\d/.test(parentTag)) codeWrapper = codeEl
    else codeWrapper = codeEl.parentElement?.parentElement?.parentElement
  
    // console.log(codeWrapper)
    if (!codeWrapper) return

    let parent = parentTag === 'LI'
        ? codeEl.parentElement.parentElement
        : codeWrapper.parentElement

    // console.log(parent)

    let codeLang = parentTag === 'PRE' 
      ? Array.from(parent.classList).find(cls => cls.indexOf('language') === 0)?.split('-').pop() || 'ezsite'
      : 'ezsite'
    if (codeLang === 'ezsite') {
      let parsed = parseCodeEl(codeEl)
      // console.log(parsed)
      if (parsed.tag) {
        let newEl = document.createElement(parsed.tag)
        if (parsed.id) newEl.id = parsed.id
        if (parsed.class) parsed.class.split(' ').forEach(c => newEl.classList.add(c))
        if (parsed.style) newEl.setAttribute('style', parsed.style)
        for (const [k,v] of Object.entries(parsed)) {
          if (k === 'tag' || k === 'id' || k === 'class' || k === 'style' || k === 'args') continue
          newEl.setAttribute(k, v === true ? '' : v)
        }
        if (parsed.args) {
          let ul = document.createElement('ul')
          newEl.appendChild(ul)
          for (const arg of parsed.args) {
            let li = document.createElement('li')
            // li.innerHTML = marked.parse(arg)
            li.innerHTML = arg
            ul.appendChild(li)
          }
        }
        if (parsed.tag === 'script') {
          document.body.appendChild(newEl)
          codeWrapper.remove()
        } else if (parsed.tag === 'link') {
          document.head.appendChild(newEl)
          codeWrapper.remove()
        } else {
          let componentType = parsed.tag.split('-').slice(1).join('-')
          if (componentType === 'header' || componentType === 'footer') {
            let existing = rootEl.querySelector(parsed.tag)
            if (existing) {
              existing.replaceWith(newEl)
              codeWrapper.remove()
            } else {
              codeWrapper.replaceWith(newEl)
            }
          }
          else codeWrapper.replaceWith(newEl)
        }
      } else if (parsed.class || parsed.style || parsed.id) {
        let target
        let priorEl = codeEl.previousElementSibling
        // if (parent.tagName !== 'P' && (priorEl?.tagName === 'EM' || priorEl?.tagName === 'STRONG')) {
        if (priorEl?.tagName === 'EM' || priorEl?.tagName === 'STRONG') {
          target = document.createElement('span')
          target.innerHTML = priorEl.innerHTML
          priorEl.replaceWith(target)
        } else if (priorEl?.tagName === 'A' || priorEl?.tagName === 'IMG') {
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

function structureContent() {
  let main = document.querySelector('main')
  // console.log(new DOMParser().parseFromString(main.outerHTML, 'text/html').firstChild.children[1].firstChild)
  let restructured = document.createElement('main')
  restructured.className = 'page-content markdown-body'
  restructured.setAttribute('aria-label', 'Content')
  restructured.setAttribute('data-theme', 'light')
  let currentSection = restructured;
  let sectionParam
  let tabGroup = 0
  let tab = 0

  // Converts empty headings (changed to paragraphs by markdown converter) to headings with the correct level
  if (main)
    Array.from(main?.querySelectorAll('p'))
    .filter(p => /^#{1,6}$/.test(p.childNodes.item(0).nodeValue?.trim() || ''))
    .forEach(p => {
      let ptext = p.childNodes.item(0).nodeValue?.trim()
      let codeEl = p.querySelector('code')
      let heading = document.createElement(`h${ptext?.length}`)
      p.replaceWith(heading)
      if (codeEl) {
        let codeWrapper = document.createElement('p')
        codeWrapper.appendChild(codeEl)
        heading.parentElement?.insertBefore(codeWrapper, heading.nextSibling)
      }
    })

  Array.from(main?.children || []).forEach(el => {
    if (el.tagName[0] === 'H' && isNumeric(el.tagName.slice(1))) {
      let heading = el
      let sectionLevel = parseInt(heading.tagName.slice(1))
      if (currentSection) {
        (Array.from(currentSection.children))
          .filter(child => !/^H\d/.test(child.tagName))
          .filter(child => !/PARAM/.test(child.tagName))
          .filter(child => !/STYLE/.test(child.tagName))
          .filter(child => !/^EZ-/.test(child.tagName))
          .forEach((child, idx) => { 
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
      let parent = sectionLevel === 1 || headings.length === 0 ? restructured : headings.pop()?.parentElement
      parent?.appendChild(currentSection)
      currentSection.setAttribute('data-id', computeDataId(currentSection))

    } else {
      el.className = 'segment'
      let segId = `${currentSection.getAttribute('data-id')}.${currentSection.children.length}`
      el.setAttribute('data-id', segId)
      el.id = segId
      if (el !== sectionParam) currentSection.innerHTML += el.outerHTML
    }
  })

  Array.from(restructured?.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  .filter(heading => !heading.innerHTML.trim())
  .forEach(heading => heading.remove())

  Array.from(restructured?.querySelectorAll('p'))
  .forEach(para => {
    let lines = para.textContent?.split('\n').map(l => l.trim()) || []
    let codeEl = para.querySelector('code')
    if (codeEl) lines = lines.slice(0,-1)
    // console.log(lines)
    if (lines.length > 1 && hasTimestamp(lines[0])) {
      para.setAttribute('data-head', lines[0])
      if (lines.length > 2) para.setAttribute('data-qids', lines[2])
      if (lines.length > 3) para.setAttribute('data-related', lines[3])
      para.innerHTML = lines[1]
      if (codeEl) para.appendChild(codeEl)
    }
  })

  Array.from(restructured?.querySelectorAll('p'))
  .filter(p => /^{.*}$/.test(p.textContent.trim()))
  .forEach(attrs => {
    let target = attrs.previousElementSibling
    while (target?.tagName !== 'P') target = target.previousElementSibling
    let parsed = parseHeadline(attrs.textContent.trim().slice(1,-1))
    console.log(parsed, target)
    target = target.parentElement
    if (parsed.id) target.id = parsed.id
    if (parsed.class) parsed.class.split(' ').forEach(c => target.classList.add(c))
    if (parsed.style) target.setAttribute('style', parsed.style)
    console.log(target)
    attrs.remove()
  })

  Array.from(restructured?.querySelectorAll('code'))
  .forEach(codeEl => handleCodeEl(restructured, codeEl))

  restructured.querySelectorAll('section').forEach(section => {
    if (section.classList.contains('cards') && !section.classList.contains('wrapper')) {
      section.classList.remove('cards')
      let wrapper = document.createElement('section')
      wrapper.className = 'cards wrapper'
      Array.from(section.children).slice(1).forEach(card => {
        wrapper.appendChild(card)
        card.classList.add('card')
        let heading = card.querySelector('h1, h2, h3, h4, h5, h6')
        if (heading) heading.remove()
        let img = card.querySelector('p > img')
        if (img) img.parentElement?.replaceWith(img)
        let link = card.querySelector('p > a')
        if (link) link.parentElement?.replaceWith(link)
      })
      section.appendChild(wrapper)
    }

    /*
    if (section.classList.contains('tabs')) {
      let tabGroup = document.createElement('sl-tab-group');
      Array.from(section.classList).forEach(cls => tabGroup.classList.add(cls))
      Array.from(section.attributes).forEach(attr => tabGroup.setAttribute(attr.name, attr.value))
      Array.from(section.querySelectorAll(':scope > section'))
      .forEach((tabSection, idx) => {
        let tab = document.createElement('sl-tab')
        tab.setAttribute('slot', 'nav')
        tab.setAttribute('panel', `tab${idx+1}`)
        tab.innerHTML = tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.innerHTML || ''
        tabGroup.appendChild(tab)      
      })
      Array.from(section.querySelectorAll(':scope > section'))
      .forEach((tabSection, idx) => {
        let tabPanel = document.createElement('sl-tab-panel')
        tabPanel.setAttribute('name', `tab${idx+1}`)
        tabPanel.innerHTML = tabSection.innerHTML || ''
        tabGroup.appendChild(tabPanel)
      })
      section.replaceWith(tabGroup)
    }
    */

    /*
    if (section.classList.contains('tabs')) {
      section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')?.remove()
      section.classList.remove('tabs')
      section.classList.add('tab-wrap')
      ++tabGroup
      Array.from(section.querySelectorAll(':scope > section'))
      .forEach((tabSection, idx) => {
        ++tab
        tabSection.className = 'tab__content'
        // tabSection.removeAttribute('id')
        
        let label = document.createElement('label')
        label.setAttribute('for', `tab${tab}`)
        label.innerHTML = tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.innerHTML
        section.insertBefore(label, section.children.item(idx*2))

        let input = document.createElement('input')
        input.className = 'tab'
        input.setAttribute('id', `tab${tab}`)
        input.setAttribute('type', 'radio')
        input.setAttribute('name', `tabGroup${tabGroup}`)
        if (idx === 0) input.setAttribute('checked', '')
        section.insertBefore(input, section.children.item(idx*2))
        
      })
      console.log(section)
    }
    */
    
    if (section.classList.contains('tabs')) {
      /* from https://codepen.io/alvarotrigo/pen/GRMbzBR */
      ++tabGroup
      let tabsWrap = document.createElement('section')
      tabsWrap.className = 'tab-wrap'
      Array.from(section.querySelectorAll(':scope > section'))
      .forEach((tabSection, idx) => {
        ++tab

        let label = document.createElement('label')
        label.setAttribute('for', `tab${tab}`)
        label.innerHTML = tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.innerHTML
        tabsWrap.insertBefore(label, tabsWrap.children.item(idx*2))

        let input = document.createElement('input')
        input.className = 'tab'
        input.setAttribute('id', `tab${tab}`)
        input.setAttribute('type', 'radio')
        input.setAttribute('name', `tabGroup${tabGroup}`)
        if (idx === 0) input.setAttribute('checked', '')
        tabsWrap.insertBefore(input, tabsWrap.children.item(idx*2))

        tabSection.className = 'tab__content'
        tabsWrap.appendChild(tabSection)
        tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.remove()
        
      })
      section.appendChild(tabsWrap)
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

  Array.from(restructured.querySelectorAll('a'))
  .filter(anchorElem => anchorElem.href.indexOf('mailto:') < 0)
  .forEach(anchorElem => {
    let link = new URL(anchorElem.href)
    let path = link.pathname.split('/').filter(p => p)
    if (path[0] === 'zoom') {
      anchorElem.classList.add('zoom')
      anchorElem.setAttribute('rel', 'nofollow')
    } else {
      let lastPathElem = path[path.length-1]
      if (/^Q\d+$/.test(lastPathElem)) {
        let ezEntityInfobox = document.createElement('ez-entity-infobox')
        ezEntityInfobox.innerHTML = anchorElem.innerHTML
        ezEntityInfobox.setAttribute('qid', lastPathElem)
        anchorElem.replaceWith(ezEntityInfobox)
      }
    }
    // if (isGHP && window.config.repo && link.origin === location.origin && link.pathname.indexOf(`/${window.config.repo}/`) !== 0) anchorElem.href = `/${window.config.repo}${link.pathname}`
  })

  /*
  Array.from(restructured.querySelectorAll('img'))
    .forEach(img => {
      if (img.parentElement?.classList.contains('card')) return
      let ezImage = document.createElement('ez-image')
      ezImage.setAttribute('src', img.src)
      ezImage.setAttribute('alt', img.alt)
      ezImage.setAttribute('left', '');
      (img.parentNode).replaceWith(ezImage)
    })
  */
  
  restructured.style.paddingBottom = '100vh'
  let footer = restructured.querySelector('ez-footer')
  if (footer) restructured.appendChild(footer)
  main?.replaceWith(restructured)
  
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

  let firstHeading = document.querySelector('h1, h2, h3')?.innerText.trim()
  let firstParagraph = document.querySelector('p')?.innerText.trim()
  
  let jldEl = document.querySelector('script[type="application/ld+json"]')
  let seo = jldEl ? JSON.parse(jldEl.innerText) : {'@context':'https://schema.org', '@type':'WebSite', description:'', headline:'', name:'', url:''}
  seo.url = location.href

  let title = meta?.getAttribute('title')
    ? meta.getAttribute('title')
    : window.config?.title
      ? window.config.title
      : header?.getAttribute('label')
        ? header.getAttribute('label')
        : firstHeading || ''

  let description =  meta?.getAttribute('description')
    ? meta.getAttribute('description')
    : window.config?.description
      ? window.config.description
      : firstParagraph || ''

  let robots = meta?.getAttribute('robots')
    ? meta?.getAttribute('robots')
    : window.config?.robots
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

function computeStickyOffsets(root) {

  const elementIsVisibleInViewport = (el, partiallyVisible = false) => {
    const { top, left, bottom, right } = el.getBoundingClientRect()
    const { innerHeight, innerWidth } = window
    return partiallyVisible
      ? ((top > 0 && top < innerHeight) ||
          (bottom > 0 && bottom < innerHeight)) &&
          ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
      : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth
  }

  function topIsVisible(el) {
    let bcr = el.getBoundingClientRect()
    return bcr.top >= 0 && bcr.top <= window.innerHeight
  }

  /*
  let stickyElems = [
    ...Array.from(root.querySelectorAll('ez-header[sticky], ez-header[sticky], ez-breadcrumbs[sticky]')),
    ...Array.from(root.querySelectorAll('.sticky'))
  ]
  */
  let stickyElems = Array.from(root.querySelectorAll('.sticky'))

  .filter(stickyEl => {
    return topIsVisible(stickyEl)
  })
  .sort((a,b) => {
      let aTop = a.getBoundingClientRect().top
      let bTop = b.getBoundingClientRect().top
      return aTop < bTop ? -1 : 1
    })
  
  // console.log('computeStickyOffsets', stickyElems.length)
  // stickyElems.forEach(stickyEl => console.log(stickyEl.getBoundingClientRect()) )
  // stickyElems.forEach(stickyEl => console.log(stickyEl) )

  // nextTick(() => stickyElems.forEach(stickyEl => console.log(stickyEl.getBoundingClientRect()) ))
  // nextTick(() => stickyElems.forEach(stickyEl => console.log(stickyEl) ))

  if (stickyElems.length === 1) {
    // if (!stickyElems[0].style.top) stickyElems[0].style.top = '0px'
  } else if (stickyElems.length > 1) {
    // nextTick(() => {
      stickyElems[0].style.zIndex = stickyElems.length
      for (let i = 1; i < stickyElems.length; i++) {
        let bcr = stickyElems[i].getBoundingClientRect()
        let left = bcr.x
        let right = bcr.x + bcr.width
        for (let j = i-1; j >= 0; --j) {
          let priorSticky = stickyElems[j]
          let bcrPrior = priorSticky.getBoundingClientRect()
          let leftPrior = bcrPrior.x
          let rightPrior = bcrPrior.x + bcrPrior.width
          if ((leftPrior <= right) && (rightPrior >= left)) {
            let priorTop = parseInt(priorSticky.style.top.replace(/px/,'')) || 0
            // console.log(priorSticky, priorTop)
            // stickyElems[i].style.top = `${Math.floor(priorTop + bcrPrior.y + bcrPrior.height)}px`
            stickyElems[i].style.top = `${Math.floor(priorTop + bcrPrior.height)}px`
            stickyElems[i].style.zIndex = stickyElems.length - i
            break
          }
        }
      }
    //})
  }
}


let activeParagraph

function observeVisible(callback = null) {

  let topMargin = Array.from(document.querySelectorAll('EZ-HEADER'))
  .map(stickyEl => (parseInt(stickyEl.style.top.replace(/px/,'')) || 0) + stickyEl.getBoundingClientRect().height)?.[0] || 0

  console.log(`observeVisible: topMargin=${topMargin}`)

  const visible = {}
  const observer = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      let para = entry.target
      let intersectionRatio = entry.intersectionRatio
      let top = para.getBoundingClientRect().top
      if (intersectionRatio > 0) visible[para.id] = {para, top, intersectionRatio}
      else delete visible[para.id]
    }

    let sortedVisible = Object.values(visible).sort((a,b) => b.intersectionRatio - a.intersectionRatio || a.top - b.top)
    // sortedVisible.forEach(v => console.log(v.para, v.intersectionRatio, v.top))

    if (activeParagraph !== sortedVisible[0]?.para) {
      activeParagraph = sortedVisible[0]?.para
      // console.log('activeParagraph', activeParagraph)
      document.querySelectorAll('p.active').forEach(p => p.classList.remove('active'))
      activeParagraph?.classList.add('active')
      computeStickyOffsets(document.querySelector('main'))
    }
  }, { root: null, threshold: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], rootMargin: `${topMargin ? -topMargin : 0}px 0px 0px 0px`})

  // target the elements to be observed
  document.querySelectorAll('p').forEach((paragraph) => observer.observe(paragraph))
}

function loadDependency(dependency, callback) {
  let e = document.createElement(dependency.tag)
  Object.entries(dependency).forEach(([k, v]) => { if (k !== 'tag') e.setAttribute(k, v) })
  e.addEventListener('load', callback)
  if (dependency.tag === 'script') document.body.appendChild(e)
  else document.head.appendChild(e)
}

function loadDependencies(dependencies, callback, i) {
  i = i || 0
  if (dependencies.length === 0) {
    if (callback) callback()
    else return
  } else {
    loadDependency(dependencies[i], () => {
      if (i < dependencies.length-1) loadDependencies(dependencies, callback, i+1) 
      else if (callback) callback()
    })
  }
}

function init() {
  window.config = {...window.config, ...{isJunctureV1}}
  structureContent()
  setMeta()
  console.log(window.config)
  
  if (isJunctureV1) createJunctureV1App()
  else setTimeout(() => observeVisible(), 0)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { init() }) // Loading hasn't finished yet, wait for it
else init()
