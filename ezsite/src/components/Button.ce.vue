<template>

  <sl-icon-button name="gear" label="Settings"></sl-icon-button>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
  // import '@shoelace-style/shoelace/dist/components/button/button.js'
  // import '@shoelace-style/shoelace/dist/components/icon/icon.js'

  const props = defineProps({
    href: { type: String },
    label: { type: String },
    icon: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  onMounted(() => {
  })

  watch(host, () => {
  })


</script>

<style src='../style.css'></style> 

<style>
  :host {
    display: inline-block;
  }
  svg {
    width: 2em;
    height: 2em;
    vertical-align: middle;
    margin-right: 0.5em;
  }
</style>