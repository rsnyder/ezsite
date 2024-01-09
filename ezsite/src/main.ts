import { defineCustomElement } from 'vue'
import ('preline')

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
// setBasePath('https://juncture-digital.github.io/web-components/src')
// setBasePath('https://raw.githubusercontent.com//juncture-digital/web-components/main/src')
setBasePath('node_modules/@shoelace-style/shoelace/dist');

import Accordion from './components/Accordion.ce.vue'
import Button from './components/Button.ce.vue'
import Collapse from './components/Collapse.ce.vue'
import EntityInfobox from './components/EntityInfobox.ce.vue'
// import Header from './components/Header.ce.vue'
// import Hero from './components/Hero.ce.vue'
import Image from './components/Image.ce.vue'
// import ManifestPopup from './components/ManifestPopup.ce.vue'
// import Menu from './components/Menu.ce.vue'
import Meta from './components/Meta.ce.vue'
import Modal from './components/Modal.ce.vue'
// import Navbar from './components/Navbar.ce.vue'
import Trigger from './components/Trigger.ce.vue'


function defineCustomElements() {
	customElements.define('ez-accordion', defineCustomElement(Accordion))
	customElements.define('ez-button', defineCustomElement(Button))
	customElements.define('ez-collapse', defineCustomElement(Collapse))
	customElements.define('ez-entity-infobox', defineCustomElement(EntityInfobox))
	// customElements.define('ez-header', defineCustomElement(Header))
	// customElements.define('ez-hero', defineCustomElement(Hero))
	customElements.define('ez-image', defineCustomElement(Image))
	// customElements.define('ez-manifest-popup', defineCustomElement(ManifestPopup))
	// customElements.define('ez-menu', defineCustomElement(Menu))
	customElements.define('ez-meta', defineCustomElement(Meta))
	// customElements.define('ez-navbar', defineCustomElement(Navbar))
	customElements.define('ez-modal', defineCustomElement(Modal))
	customElements.define('ez-trigger', defineCustomElement(Trigger))
}

import { getConfig, loadDependencies, md2html, structureContent } from './utils'
export { md2html }
let window = (globalThis as any).window as any
window.md2html = md2html

// @ts-ignore
console.log(`ezsite: version=${process.env.version}`)

defineCustomElements()

loadDependencies([
  {tag: 'script', src: 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js'},
	{tag: 'script', src: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', crossorigin: 'anonymous', referrerpolicy: 'no-referrer'}],
	async () => {
		window.config = await getConfig()
		console.log(window.config)
    if (window.config.stylesheets) {
		loadDependencies(
			window.config.stylesheets.map(ss => {
				return {tag: 'link', href: ss[0] == '/' ? ss : `${window.config.baseurl || 'http://localhost:8080'}/${ss}`, rel: 'stylesheet'}
			}), 
			() => {structureContent()}
		)
	} else structureContent()
})
