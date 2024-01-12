import { defineCustomElement } from 'vue'
import ('preline')

import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
import '@shoelace-style/shoelace/dist/components/menu/menu.js'
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
// setBasePath('https://raw.githubusercontent.com/rsnyder/ezsite/ezsite/dist')
setBasePath('node_modules/@shoelace-style/shoelace/dist');

// import Button from './components/Button.ce.vue'
// import Dropdown from './components/Dropdown.ce.vue'
// import EntityInfobox from './components/EntityInfobox.ce.vue'
import Header from './components/Header.ce.vue'
import Hero from './components/Hero.ce.vue'
import Image from './components/Image.ce.vue'
// import ManifestPopup from './components/ManifestPopup.ce.vue'
import Menu from './components/Menu.ce.vue'
// import Meta from './components/Meta.ce.vue'
// import Modal from './components/Modal.ce.vue'
import Navbar from './components/Navbar.ce.vue'
// import Trigger from './components/Trigger.ce.vue'


function defineCustomElements() {
	// customElements.define('ez-button', defineCustomElement(Button))
	// customElements.define('ez-dropdown', defineCustomElement(Dropdown))
	// customElements.define('ez-entity-infobox', defineCustomElement(EntityInfobox))
	customElements.define('ez-header', defineCustomElement(Header))
	customElements.define('ez-hero', defineCustomElement(Hero))
	customElements.define('ez-image', defineCustomElement(Image))
	// customElements.define('ez-manifest-popup', defineCustomElement(ManifestPopup))
	customElements.define('ez-menu', defineCustomElement(Menu))
	// customElements.define('ez-meta', defineCustomElement(Meta))
	customElements.define('ez-navbar', defineCustomElement(Navbar))
	// customElements.define('ez-modal', defineCustomElement(Modal))
	// customElements.define('ez-trigger', defineCustomElement(Trigger))
}

import { getConfig, setMeta, loadDependencies, md2html, structureContent, observeVisible } from './utils'
export { md2html }
let window = (globalThis as any).window as any
window.md2html = md2html

// @ts-ignore
console.log(`ezsite: version=${process.env.version}`)

loadDependencies([
  {tag: 'script', src: 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js'},
	{tag: 'script', src: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', crossorigin: 'anonymous', referrerpolicy: 'no-referrer'}],
	async () => {
		window.config = await getConfig()
    if (window.config.stylesheets) {
		let stylesheets = window.config.stylesheets.map(ss => {
			let href = ss.indexOf('http') == 0
				? ss
				: location.hostname == 'localhost'
					? `http://localhost:8080/${ss[0] == '/' ? ss.slice(1) : ss}`
					: `${window.config.baseurl}/${ss[0] == '/' ? ss.slice(1) : ss}`
			return {tag: 'link', href, rel: 'stylesheet'}
		})
		loadDependencies(stylesheets,
			() => {
				structureContent()
				defineCustomElements()
				setMeta()
				console.log(window.config)
				observeVisible()
			}
		)
	} else {
		structureContent()
		defineCustomElements()
		setMeta()
		console.log(window.config)
		observeVisible()
	}
})
