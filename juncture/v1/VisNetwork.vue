<template>
  <div class="grid-container" :style="containerStyle">
    <div id="mynetwork" :style="networkStyle"></div>
    <div class="footerBar">
    <span class="title">{{this.items[0].title}}</span>
    </div>
  </div>
</template>

<script>
function md5cycle(f,h){var i=f[0],n=f[1],r=f[2],g=f[3];i=ff(i,n,r,g,h[0],7,-680876936),g=ff(g,i,n,r,h[1],12,-389564586),r=ff(r,g,i,n,h[2],17,606105819),n=ff(n,r,g,i,h[3],22,-1044525330),i=ff(i,n,r,g,h[4],7,-176418897),g=ff(g,i,n,r,h[5],12,1200080426),r=ff(r,g,i,n,h[6],17,-1473231341),n=ff(n,r,g,i,h[7],22,-45705983),i=ff(i,n,r,g,h[8],7,1770035416),g=ff(g,i,n,r,h[9],12,-1958414417),r=ff(r,g,i,n,h[10],17,-42063),n=ff(n,r,g,i,h[11],22,-1990404162),i=ff(i,n,r,g,h[12],7,1804603682),g=ff(g,i,n,r,h[13],12,-40341101),r=ff(r,g,i,n,h[14],17,-1502002290),i=gg(i,n=ff(n,r,g,i,h[15],22,1236535329),r,g,h[1],5,-165796510),g=gg(g,i,n,r,h[6],9,-1069501632),r=gg(r,g,i,n,h[11],14,643717713),n=gg(n,r,g,i,h[0],20,-373897302),i=gg(i,n,r,g,h[5],5,-701558691),g=gg(g,i,n,r,h[10],9,38016083),r=gg(r,g,i,n,h[15],14,-660478335),n=gg(n,r,g,i,h[4],20,-405537848),i=gg(i,n,r,g,h[9],5,568446438),g=gg(g,i,n,r,h[14],9,-1019803690),r=gg(r,g,i,n,h[3],14,-187363961),n=gg(n,r,g,i,h[8],20,1163531501),i=gg(i,n,r,g,h[13],5,-1444681467),g=gg(g,i,n,r,h[2],9,-51403784),r=gg(r,g,i,n,h[7],14,1735328473),i=hh(i,n=gg(n,r,g,i,h[12],20,-1926607734),r,g,h[5],4,-378558),g=hh(g,i,n,r,h[8],11,-2022574463),r=hh(r,g,i,n,h[11],16,1839030562),n=hh(n,r,g,i,h[14],23,-35309556),i=hh(i,n,r,g,h[1],4,-1530992060),g=hh(g,i,n,r,h[4],11,1272893353),r=hh(r,g,i,n,h[7],16,-155497632),n=hh(n,r,g,i,h[10],23,-1094730640),i=hh(i,n,r,g,h[13],4,681279174),g=hh(g,i,n,r,h[0],11,-358537222),r=hh(r,g,i,n,h[3],16,-722521979),n=hh(n,r,g,i,h[6],23,76029189),i=hh(i,n,r,g,h[9],4,-640364487),g=hh(g,i,n,r,h[12],11,-421815835),r=hh(r,g,i,n,h[15],16,530742520),i=ii(i,n=hh(n,r,g,i,h[2],23,-995338651),r,g,h[0],6,-198630844),g=ii(g,i,n,r,h[7],10,1126891415),r=ii(r,g,i,n,h[14],15,-1416354905),n=ii(n,r,g,i,h[5],21,-57434055),i=ii(i,n,r,g,h[12],6,1700485571),g=ii(g,i,n,r,h[3],10,-1894986606),r=ii(r,g,i,n,h[10],15,-1051523),n=ii(n,r,g,i,h[1],21,-2054922799),i=ii(i,n,r,g,h[8],6,1873313359),g=ii(g,i,n,r,h[15],10,-30611744),r=ii(r,g,i,n,h[6],15,-1560198380),n=ii(n,r,g,i,h[13],21,1309151649),i=ii(i,n,r,g,h[4],6,-145523070),g=ii(g,i,n,r,h[11],10,-1120210379),r=ii(r,g,i,n,h[2],15,718787259),n=ii(n,r,g,i,h[9],21,-343485551),f[0]=add32(i,f[0]),f[1]=add32(n,f[1]),f[2]=add32(r,f[2]),f[3]=add32(g,f[3])}function cmn(f,h,i,n,r,g){return h=add32(add32(h,f),add32(n,g)),add32(h<<r|h>>>32-r,i)}function ff(f,h,i,n,r,g,t){return cmn(h&i|~h&n,f,h,r,g,t)}function gg(f,h,i,n,r,g,t){return cmn(h&n|i&~n,f,h,r,g,t)}function hh(f,h,i,n,r,g,t){return cmn(h^i^n,f,h,r,g,t)}function ii(f,h,i,n,r,g,t){return cmn(i^(h|~n),f,h,r,g,t)}function md51(f){txt="";var h,i=f.length,n=[1732584193,-271733879,-1732584194,271733878];for(h=64;h<=f.length;h+=64)md5cycle(n,md5blk(f.substring(h-64,h)));f=f.substring(h-64);var r=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(h=0;h<f.length;h++)r[h>>2]|=f.charCodeAt(h)<<(h%4<<3);if(r[h>>2]|=128<<(h%4<<3),h>55)for(md5cycle(n,r),h=0;h<16;h++)r[h]=0;return r[14]=8*i,md5cycle(n,r),n}function md5blk(f){var h,i=[];for(h=0;h<64;h+=4)i[h>>2]=f.charCodeAt(h)+(f.charCodeAt(h+1)<<8)+(f.charCodeAt(h+2)<<16)+(f.charCodeAt(h+3)<<24);return i}var hex_chr="0123456789abcdef".split("");function rhex(f){for(var h="",i=0;i<4;i++)h+=hex_chr[f>>8*i+4&15]+hex_chr[f>>8*i&15];return h}function hex(f){for(var h=0;h<f.length;h++)f[h]=rhex(f[h]);return f.join("")}function md5(f){return hex(md51(f))}function add32(f,h){return f+h&4294967295}

/* global vis, L */
const viewerLabel = "Network Viewer"
const viewerIcon = "fas fa-project-diagram"
const dependencies = [
  "https://unpkg.com/vis-network/styles/vis-network.min.css",
  "https://unpkg.com/vis-data@latest/peer/umd/vis-data.min.js",
  "https://unpkg.com/vis-network@latest/peer/umd/vis-network.min.js",
];
const defaults = {
  popupOptions: { autoClose: false, closeButton: false, closeOnClick: false },
};
module.exports = {
  name: "ve-vis-network",
  props: {
    items: { type: Array, default: () => [] },
    viewerIsActive: Boolean,
    selected: String,
    width: Number,
    height: Number,
    hoverItemID: String,
    selectedItemID: String,
  },
  data: () => ({
    viewerLabel,
    viewerIcon,
    activeWindow: undefined,
    popups: {},
    active: new Set(),
  }),
  computed: {
    networkStyle() {
            return {
                width: `${this.width}px`,
                //height: `${this.height}px`,
                overflowY: 'auto !important',
                marginLeft: '0',   
            }
    },
    containerStyle() {
      return {
        width: `${this.width}px`,
        height: this.viewerIsActive ? `${this.height}px` : '0',
        overflowY: "auto !important",
        backgroundColor: this.items[0] ? this.items[0].background || 'white' : 'white',
      };
    },
    activeElements() {
      return this.$store.getters.activeElements;
    },
    entities() {
      return this.itemsInActiveElements.filter((item) => item.tag === "entity");
    },
    itemsInActiveElements() {
      return this.$store.getters.itemsInActiveElements;
    },
    apiBaseURL() {
      return window.location.origin;
    },
    input() { 
      console.log(this.items[0])
      return this.items[0] && this.items[0].file || this.items[0].url
    }
  },
  mounted() {
    this.loadDependencies(dependencies, 0, this.init);
  },
  methods: {
    init() {
      var nodeslist = []
      var edgeslist = []
      //get input data here from file
      this.getInput(this.input)
        .then((delimitedDataString) => {
          const delimiter = this.input.split(".").pop() == "tsv" ? "\t" : ",";
          const data = this.transformData(
            this.delimitedStringToObjArray(delimitedDataString, delimiter)
          )
          edgeslist = data.edges
          return this.getImages(data.nodes)
        })
        .then(nodesWithImages => nodeslist = nodesWithImages)
        .then(() => this.renderGraph(nodeslist, edgeslist))
    },
    renderGraph(nodeslist, edgeslist) {
      let nodes = new vis.DataSet(nodeslist);
      let edges = new vis.DataSet(edgeslist);
      var container = document.getElementById("mynetwork");
      var data = {
        nodes: nodes,
        edges: edges,
      };
      let options = {
        interaction: { hover: true },
        physics:{
           stabilization: false,
       },
        layout: {
          randomSeed: undefined,
          improvedLayout: false,
          clusterThreshold: 250,
          hierarchical: this.items[0].layout === "hierarchy" ? true : false,
        },
        edges: {
          arrows: this.items[0].arrows || 'to',
          //color: 'red',
          scaling: {
            label: true,
          },
          shadow: true,
          smooth: true,
          length: 300,
        },
      };
      //init network
      var network = new vis.Network(container, data, options);
      network.on("click", (properties) => {
        var ids = properties.nodes;
        var clickedNodes = nodes.get(ids);
        if (clickedNodes.length > 0) {
          this.setSelectedItemID(clickedNodes[0].qid);
        }
      });
      network.body.emitter.emit("_dataChanged");
      network.redraw();
    },
    setHoverItemID(itemID) {
      this.$emit("hover-id", itemID);
    },
    setSelectedItemID(itemID) {
      this.$emit("selected-id", itemID);
    },
    addEventHandlers(elem, itemId) {
      elem.on("click", () => {
        this.setSelectedItemID(itemId);
      });
      elem.on("mouseover", () => {
        this.setHoverItemID(itemId);
      });
      elem.on("mouseout", () => {
        this.setHoverItemID();
      });
    },
    addPopup(id, label, latLng, offset) {
      if (!this.popups[id]) {
        const popup = L.popup({
          ...defaults.popupOptions,
          ...{ offset: L.point(0, offset || 0) },
        });
        popup.setLatLng(latLng);
        popup.setContent(`<h1 data-eid="${id}">${label}</h1>`);
        popup.options.id = id;
        this.popups[id] = popup;
      }
    },
    getInput() {
      return fetch(this.input).then((resp) => resp.text());
    },
    transformData(objArray) {
      const nodes = {};
      const transformed = { nodes: [], edges: [] };
      objArray.forEach((obj) => {
        ['source', 'target'].forEach((nodeType) => {
          let nodeId = obj[nodeType].id || obj[nodeType].label;
          if (nodes[nodeId] === undefined) {
            let id = `${transformed.nodes.length}`;
            let qid =
              obj[nodeType].id[0] === "Q" ? obj[nodeType].id : undefined;
            let label = obj[nodeType].label || obj[nodeType].id;
            let x = obj[nodeType].x ? (this.width)*(obj[nodeType].x/100) : undefined;
            let y = obj[nodeType].y ? (this.height)*(obj[nodeType].y/100) : undefined;
            let physics = obj[nodeType].x && obj[nodeType].y ? false : true;
            let image = obj[nodeType].image ? obj[nodeType].image : undefined;
            let shape = obj[nodeType].image ? "circularImage" : undefined;
            let title = obj[nodeType].label || obj[nodeType].id;
            
            var element = document.createElement("div");
            element.className = 'node'+id;
            if (obj[nodeType].html){
              element.innerHTML = obj[nodeType].html;
              title = element;
            }
            
            nodes[nodeId] = id;
            if (label !== ""){
              transformed.nodes.push({ id, qid, label, title: title, x, y, physics, image, shape });
            }
          }
        });
      });
      objArray.forEach((obj) => {
        if (obj.target.id !== ""){
          transformed.edges.push({
            from: nodes[obj.source.id || obj.source.label],
            to: nodes[obj.target.id || obj.target.label],
            title: obj.edge ? (obj.edge.label || obj.edge.id) : ''
          });
        }
        
      });
      return transformed;
    },
    async getImages(nodeslist) {
      let eids = nodeslist.filter(node => node.qid).map(node => node.qid)
      let entities = await this.getEntityData(eids)
      return nodeslist.map(node => {
        if (node.qid) {
          node.image = entities[node.qid].thumbnails[0]
          node.shape = 'circularImage'
        }
        return node
      })
    },
  
    // Gets labels and images for referenced Wikdata entities
    async getEntityData(eids) {
      let values = Array.from(eids).map(eid => `(<http://www.wikidata.org/entity/${eid}>)`).join(' ')
      let query = `SELECT ?item ?label ?images WHERE {
                      VALUES (?item) { ${values} }
                      ?item rdfs:label ?label . FILTER(LANG(?label) = 'en')
                      OPTIONAL { ?item wdt:P18 ?images . }
                    }`
      let resp = await fetch('https://query.wikidata.org/sparql', {
        method: 'POST', body: `query=${encodeURIComponent(query)}`, 
        headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      resp = await resp.json()
      let entities = {}
      resp.results.bindings.forEach(rec => {
        let eid = rec.item.value.split('/').pop()
        if (!entities[eid]) entities[eid] = {eid, label: rec.label.value, images: [], thumbnails: []}
        if (rec.images && entities[eid].images.indexOf(rec.images.value) < 0) {
          entities[eid].images.push(rec.images.value)
          entities[eid].thumbnails.push(this.commonsImageUrl(rec.images.value, 200))
        }
      })
      return entities
    },
    commonsImageUrl(url, width) {
      // Converts Wikimedia commons File URL to an image link
      //  If a width is provided a thumbnail is returned
      let mwImg = url.indexOf('Special:FilePath') > 0 ? url.split('/Special:FilePath/').pop() :  url.split('/File:').pop()
      mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
      const ImgMD5 = md5(mwImg)
      const extension = mwImg.slice(mwImg.length-4)
      let imgUrl = `https://upload.wikimedia.org/wikipedia/commons/${width ? 'thumb/' : ''}`
      imgUrl += `${ImgMD5.slice(0,1)}/${ImgMD5.slice(0,2)}/${mwImg}`
      if (width) imgUrl += `/${width}px-${mwImg}`
      if (extension === '.svg') imgUrl += '.png'
      if (extension === '.tif') imgUrl += '.jpg'
      return imgUrl
    }
    
  },
  watch: {
    items() {
      this.init()
    }
  }
};
</script>

<style>
  .vis-network {
    overflow: visible;
  }
  #vis,
  .grid-container {
        display: grid;
        grid-template-rows: 1fr auto;
        grid-template-areas:
        "main"
        "footer";
    }
  .footerBar {
      /* row-start / column-start / row-end / column-end */
      grid-area: footer;
      z-index: 2;
      justify-self: stretch;
      align-self: stretch;
      /* background-color: rgba(255, 255, 255, 0.8); */
      background-color: #ccc;
      padding: 9px 6px;
        text-align: center;
        line-height: 1;
    }
  #mynetwork {
    /*width: 100%;
    height: 100%;
    */
    grid-area: main
  }
  #networktitle {
    z-index:100;
    right: 0;
    bottom: 0;
    width: 100%;
    font: 1.0em;
    background-color:rgba(143, 223, 255, 0.5);
    padding: 2%;
    color: black;
    text-align: center;
  }
  .title {
      font-size: 0.9rem;
      font-weight: bold;
    }
</style>
