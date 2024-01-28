import { defineCustomElement } from 'vue'
import ('preline')
import * as yaml from 'js-yaml'

import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
import '@shoelace-style/shoelace/dist/components/menu/menu.js'
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js'
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js'
import '@shoelace-style/shoelace/dist/components/tab/tab.js'

import '@shoelace-style/shoelace/dist/themes/light.css'
import './css/github-markdown.css' /* From https://github.com/sindresorhus/github-markdown-css */
import './css/cards.css'
import './css/default.css'

import './assets/iiif.png'

import Breadcrumbs from './components/Breadcrumbs.ce.vue'
// import Button from './components/Button.ce.vue'
// import Dropdown from './components/Dropdown.ce.vue'
import EntityInfobox from './components/EntityInfobox.ce.vue'
import Footer from './components/Footer.ce.vue'
import Header from './components/Header.ce.vue'
import Image from './components/Image.ce.vue'
import Manifest from './components/Manifest.ce.vue'
import ManifestPopup from './components/ManifestPopup.ce.vue'
import Menu from './components/Menu.ce.vue'
// import Meta from './components/Meta.ce.vue'
// import Modal from './components/Modal.ce.vue'
// import Trigger from './components/Trigger.ce.vue'


function defineCustomElements() {
	customElements.define('ez-breadcrumbs', defineCustomElement(Breadcrumbs))
	// customElements.define('ez-button', defineCustomElement(Button))
	// customElements.define('ez-dropdown', defineCustomElement(Dropdown))
	customElements.define('ez-entity-infobox', defineCustomElement(EntityInfobox))
	customElements.define('ez-footer', defineCustomElement(Footer))
	customElements.define('ez-header', defineCustomElement(Header))
	customElements.define('ez-image', defineCustomElement(Image))
	customElements.define('ez-manifest', defineCustomElement(Manifest))
	customElements.define('ez-manifest-popup', defineCustomElement(ManifestPopup))
	customElements.define('ez-menu', defineCustomElement(Menu))
	// customElements.define('ez-meta', defineCustomElement(Meta))
	// customElements.define('ez-modal', defineCustomElement(Modal))
	// customElements.define('ez-trigger', defineCustomElement(Trigger))
}

import { observeVisible } from './utils'

// @ts-ignore
console.log(`ezsite: version=${process.env.version}`)

console.log(window.config)

window.config = yaml.load(window.config)
console.log(window.config)

defineCustomElements()
observeVisible()
