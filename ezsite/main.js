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
    else if (/^\w+-[-\w]*\w+$/.test(token)) parsed['tag'] = token
    else parsed[token] = true
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
  console.log(codeEl)
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
  
    console.log(codeWrapper)
    if (!codeWrapper) return

    let parent = parentTag === 'LI'
        ? codeEl.parentElement.parentElement
        : codeWrapper.parentElement
    let codeLang = parentTag === 'PRE' 
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
          if (k === 'tag' || k === 'id' || k === 'class' || k === 'style' || k === 'args') continue
          ezComponent.setAttribute(k, v === true ? '' : v)
        }
        if (parsed.args) {
          let ul = document.createElement('ul')
          ezComponent.appendChild(ul)
          for (const arg of parsed.args) {
            let li = document.createElement('li')
            // li.innerHTML = marked.parse(arg)
            li.innerHTML = arg
            ul.appendChild(li)
          }
        }
        let componentType = parsed.tag.split('-').slice(1).join('-')
        if (componentType === 'header' || componentType === 'footer') {
          let existing = rootEl.querySelector(parsed.tag)
          if (existing) {
            existing.replaceWith(ezComponent)
            codeWrapper.remove()
          }
          else codeWrapper.replaceWith(ezComponent)
        }
        else codeWrapper.replaceWith(ezComponent)
      } else if (parsed.class || parsed.style || parsed.id) {
        let target
        let priorEl = codeEl.previousElementSibling
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
  let restructured = document.createElement('main')
  restructured.className = 'page-content markdown-body'
  restructured.setAttribute('aria-label', 'Content')
  let currentSection = restructured;
  let sectionParam

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

structureContent()
setMeta()
