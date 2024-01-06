<template>
  <div ref="root" :style="containerStyle">

    <div style="display:flex; flex-direction:column;height:100%;">
      <iframe :id="id" :name="name" :allow="allow" :height="iframeHeight" :width="iframeWidth" :allowfullscreen="allowfullscreen" :mozallowfullscreen="allowfullscreen" :msallowfullscreen="allowfullscreen" :webkitallowfullscreen="allowfullscreen" :frameborder="frameborder" :src="src" :allowtransparency="allowtransparency" :referrerpolicy="referrerpolicy"></iframe>
      <div v-if="caption" class="caption">{{ caption }}</div>
    </div>
  </div>  
</template>

<script>

module.exports = {
  name: 've-iframe',
  props: { 
    items: { type: Array, default: () => ([]) },
    viewerIsActive: Boolean
  },
  data: () => ({
    viewerLabel: 'IFrame',
    viewerIcon: 'fas fa-file-code',
    dependencies: []
  }),
  computed: {
    containerStyle() { return { 
      position: 'relative',
      height: this.viewerIsActive ? '100%' : '0', 
      overflowY: 'auto !important' 
    }},
    filteredItems() { return this.items.filter(item => item[this.$options.name]) },
    item() { return this.filteredItems[0] },
    id() { return this.item.id || '' },
    name() { return this.item.name || '' },
    caption() { return this.item.caption || ''},
    allow() { return this.item.allow || '' },
    iframeHeight() { return this.item.height || '100%' },
    iframeWidth() { return this.item.width || '100%' },
    allowfullscreen() { return this.item.allowfullscreen || 'true' },
    src() { return this.item.src || '' },
    allowtransparency() { return this.item.allowtransparency || 'true' },
    referrerpolicy() { return this.item.referrerpolicy || '' },
    frameborder() { return this.item.frameborder || '0' }
  },
  mounted() { this.loadDependencies(this.dependencies, 0, this.init) },
  methods: {
    init() {
    }
  }
}
</script>

<style>
  .caption {
    max-height: 50px;
    overflow: auto;
    background-color: rgb(204, 204, 204);
    padding: 9px 6px;
    text-align: center;
    line-height: 1;
    font-size: 0.9rem;
    font-weight: bold;
  }
</style>