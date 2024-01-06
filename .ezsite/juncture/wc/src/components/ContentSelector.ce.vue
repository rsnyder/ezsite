
<template>

  <div ref="root">

    <section class="content-path" style="position:relative;">
      
      <div class="workspace">

        <sl-tooltip :content="`${acct}: ${repo} (${branch})`" :disabled="isMobile" placement="bottom">
          <sl-button pill size="medium" @click="toggleDrawer">
            <sl-icon slot="prefix" name="github" style="fontSize:24px;"></sl-icon>
          </sl-button>
        </sl-tooltip>

        <div class="ws-path">   
          <div class="breadcrumbs">
            <sl-breadcrumb>
              <sl-breadcrumb-item>
              <sl-button  pill size="medium" @click="prunePath(0)">/
                <sl-icon slot="prefix" name="folder2" style="fontSize:24px;"></sl-icon>
              </sl-button>
              </sl-breadcrumb-item>
              <sl-breadcrumb-item v-for="pathElem, idx in path" :key="`bci-${idx}`">
                <template v-if="idx === path.length-1" >
                  <span v-if="compact" class="path-elem" v-html="pathElem" @click="prunePath(idx+1)"></span>
                  <sl-button v-else pill size="medium" @click="prunePath(idx+1)">
                    {{pathElem}}
                    <sl-icon slot="prefix" name="filetype-md" style="fontSize:24px;"></sl-icon>
                  </sl-button>
                  <sl-dropdown slot="suffix">
                    <sl-icon-button slot="trigger" name="caret-down" label="File actions"></sl-icon-button>
                    <sl-menu>
                      <sl-menu-item @click="() => fileToDelete = pathElem">Delete file<sl-icon slot="prefix" name="trash"></sl-icon></sl-menu-item>
                    </sl-menu>
                  </sl-dropdown>
                </template>
                <template v-else>
                  <span v-if="compact" class="path-elem" v-html="pathElem" @click="prunePath(idx+1)"></span>
                  <sl-button v-else pill size="medium" @click="prunePath(idx+1)">
                    {{pathElem}}
                    <sl-icon slot="prefix" name="folder2" style="fontSize:24px;"></sl-icon>
                  </sl-button>
                </template>
              </sl-breadcrumb-item>
            </sl-breadcrumb>
            <sl-tooltip v-if="isLoggedIn && mode === 'media'" :content="`Add ${props.mode === 'media' ? 'resource' : 'file'}`" placement="bottom">
              <sl-button 
                variant="default" 
                :size="mode === 'media' ? 'medium' : 'small'"
                class="add-item" 
                :name="`Add ${mode === 'media' ? 'resource' : 'file'}`"
                circle 
                @click="onAddFileClicked"
              >
                <sl-icon name="plus-lg" label="Add file"></sl-icon>
              </sl-button>
            </sl-tooltip>
          </div>
          <sl-drawer noHeader label="Workspace" placement="bottom" contained class="workspace-selector" style="--size:100%">
            <div style="display:flex; height:100%; align-items:center;">
            <div v-if="!compact" class="github-select">Select GitHub Repository</div>
            <sl-icon v-if="!compact" name="chevron-double-right" style="fontSize:24px;"></sl-icon>
            
            <sl-breadcrumb style="margin-left:12px;">
              
              <!-- Account selector -->
              <sl-breadcrumb-item>
                <sl-tooltip content="Github Account" hoist :disabled="isMobile" placement="left">
                  <sl-dropdown v-if="accts.length > 1">
                    <span v-if="compact"  slot="trigger" class="path-elem">{{ acct }}</span>
                    <sl-button v-else slot="trigger" pill size="medium" class="folder">
                      {{acct}}
                      <sl-icon slot="prefix" name="github" style="fontSize:24px;"></sl-icon>
                    </sl-button>
                    <sl-menu>
                      <sl-menu-item v-for="_acct, idx in accts" :key="`acct-${idx}`" :checked="_acct.login === acct" @click="accountSelected(_acct)" type="checkbox" v-html="_acct.login"></sl-menu-item>
                    </sl-menu>
                  </sl-dropdown>
                  <template v-else>
                    <span v-if="compact" class="path-elem">{{ branch }}</span>
                    <sl-button v-else pill size="medium" class="folder">
                      {{acct}}
                      <sl-icon slot="prefix" name="github" style="fontSize:24px;"></sl-icon>
                    </sl-button>
                  </template>
                </sl-tooltip>
              </sl-breadcrumb-item>

              <!-- Repository selector -->
              <sl-breadcrumb-item>
                <sl-tooltip content="Github Repository" hoist :disabled="isMobile" placement="left">
                  <sl-dropdown v-if="repos.length > 1">
                    <span v-if="compact"  slot="trigger" class="path-elem">{{ repo }}</span>
                    <sl-button v-else slot="trigger" pill size="medium">
                      {{repo}}
                      <sl-icon slot="prefix" name="archive" style="fontSize:24px;"></sl-icon>
                    </sl-button>
                    <sl-menu>
                      <sl-menu-item v-for="_repo, idx in repos" :key="`repo-${idx}`" :checked="_repo.name === repo" @click="repoSelected(_repo)" type="checkbox" v-html="_repo.name"></sl-menu-item>
                      <sl-divider></sl-divider>
                      <sl-menu-item class="add-repo" @click="showAddRepoDialog">
                        <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                        New repository
                      </sl-menu-item>
                    </sl-menu>
                  </sl-dropdown>
                  <template v-else>
                    <span v-if="compact" class="path-elem">{{ repo }}</span>
                    <sl-button v-else pill size="medium">
                      {{repo}}
                      <sl-icon slot="prefix" name="archive" style="fontSize:24px;"></sl-icon>
                    </sl-button>
                  </template>
                </sl-tooltip>
              </sl-breadcrumb-item>

              <!-- Branch selector -->
              <sl-breadcrumb-item>
                <sl-tooltip content="Github Branch" hoist :disabled="isMobile" placement="left">
                  <sl-dropdown v-if="branches.length > 1">
                    <span v-if="compact" slot="trigger" class="path-elem">{{ branch }}</span>
                    <sl-button v-else slot="trigger" pill size="medium">
                      {{branch}}
                      <sl-icon slot="prefix" name="share" style="fontSize:24px;"></sl-icon>
                    </sl-button>
                    <sl-menu>
                      <sl-menu-item v-for="_branch, idx in branches" :key="`branch-${idx}`" :checked="_branch.name === branch" @click="branchSelected(_branch)"  type="checkbox" v-html="_branch.name"></sl-menu-item>
                    </sl-menu>
                  </sl-dropdown>
                  <template v-else>
                    <span v-if="compact" class="path-elem"> {{ branch }}</span>
                    <sl-button v-else pill size="medium">
                      {{branch}}
                      <sl-icon slot="prefix" name="share" style="fontSize:24px;"></sl-icon>
                    </sl-button>
                  </template>
                </sl-tooltip>
              </sl-breadcrumb-item>
            </sl-breadcrumb>
            </div>
          </sl-drawer>
        </div>
      </div>
      <sl-divider v-if="dirList.filter(item => props.mode === 'essays' || item.type === 'dir').length > 0"></sl-divider>
      
      <!-- Directory contents -->
      <div v-if="dirList.length > 0" class="dirs">
        
        <sl-button v-for="item, idx in dirList.filter(item => props.mode === 'essays' || item.type === 'dir')" :key="`child-${idx}`" @click="appendPath(item)" pill size="small" :class="item.type">
          <sl-icon slot="prefix" :name="item.type === 'dir' ? 'folder2' : 'file-earmark'"></sl-icon>
          {{item.name}}
        </sl-button>

        <sl-tooltip v-if="path && (path.length === 0 || (path[path.length-1].split('.').pop() !== 'md')) && props.mode === 'essays'" :content="`Add ${mode === 'media' ? 'resource' : 'file'}`" placement="bottom">
          <sl-button 
            variant="default" 
            size="small"
            class="add-item" 
            name="`Add file"
            circle 
            @click="onAddFileClicked"
          >
            <sl-icon name="plus-lg" label="Add file"></sl-icon>
          </sl-button>
        </sl-tooltip>
    </div>
    </section>

    <sl-dialog id="add-repo-dialog" label="Add Repository">
      <form id="add-repo-form" class="input-validation-pattern">
        <sl-input autocomplete="off" required id="add-repo-input" placeholder="Enter name" pattern="^[A-z0-9\-_]+$"></sl-input>
        <br />
        <sl-button @click="hideAddRepoDialog">Cancel</sl-button>
        <sl-button type="submit" variant="primary">Add</sl-button>
      </form>
    </sl-dialog>

    <sl-dialog id="add-file-dialog" label="Add File">
      <form id="add-file-form" class="input-validation-pattern">
        <sl-input autocomplete="off" required id="add-file-input" placeholder="Enter file path" pattern="^\/?([A-z0-9-_+]+\/)*([A-z0-9\-]+(\.(css|md|json|geojson|yaml|yml))?)$"></sl-input>
        <br />
        <sl-button @click="hideAddFileDialog">Cancel</sl-button>
        <sl-button type="reset" variant="default">Reset</sl-button>
        <sl-button type="submit" variant="primary">Add</sl-button>
      </form>
    </sl-dialog>

    <sl-dialog id="delete-file-dialog" label="Confirm file delete">
      <div>Delete file <span v-html="fileToDelete"></span>?</div>
      <sl-button slot="footer" @click="hideDeleteFileDialog">Cancel</sl-button>
      <sl-button slot="footer" variant="primary" @click="deleteFile">Confirm</sl-button>
    </sl-dialog>

  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, onUpdated, ref, toRaw, watch } from 'vue'

  import { isMobile as _isMobile } from '../utils'
  import { GithubClient } from '../gh-utils'

  import '@shoelace-style/shoelace/dist/components/breadcrumb/breadcrumb.js'
  import '@shoelace-style/shoelace/dist/components/breadcrumb-item/breadcrumb-item.js'
  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
  import '@shoelace-style/shoelace/dist/components/divider/divider.js'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
  import '@shoelace-style/shoelace/dist/components/input/input.js'
  import '@shoelace-style/shoelace/dist/components/menu/menu.js'
  import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'
  import '@shoelace-style/shoelace/dist/components/tag/tag.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'
  import type SLDIalog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

  const props = defineProps({
    contentPath: { type: String },
    sticky: { type: Boolean, default: false },
    mode: { type: String, default: 'media' },
    compact: { type: Boolean },
  })

  const emit = defineEmits(['accessChanged', 'addMediaResource', 'contentPathChanged'])

  defineExpose({ getDirList, getFile, putFile, repositoryIsWriteable })

  const igmore = new Set(['config.yaml', 'CNAME', 'index.html', '404.html', '.nojekyll'])

  // const contentPath = ref<string>()
  
  let ready: boolean = false

  const contentPath = ref<string>('')
  watch(contentPath, () => {
    console.log(`contentPath=${toRaw(contentPath.value)}`)
    emit('contentPathChanged', contentPath.value)
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  let drawer: any

  let username: string = ''
  let useReadme: boolean = true

  const fileToDelete = ref<string | null>()
  watch(fileToDelete, () => {
    if (fileToDelete.value) showDeleteFileDialog()
  })

  const isMobile = ref(_isMobile())

  const authToken = ref<string | null>('')
  const githubClient = ref<any>()
  const isLoggedIn = ref(false)
  const userCanUpdateRepo = ref(false)
  watch(authToken, () => {
    isLoggedIn.value = window.localStorage.getItem('gh-auth-token') !== null
    githubClient.value = new GithubClient(authToken.value || '')
  })

  watch(isLoggedIn, () => {
    if (!isLoggedIn) {
      username = ''
      userCanUpdateRepo.value = false
    }
  })

  watch(userCanUpdateRepo, () => {
    emit('accessChanged', {acct: acct.value, repo: repo.value, canUpdate: userCanUpdateRepo.value})
  })

  watch(githubClient, async () => {
    // console.log('githubClient', props.contentPath)
    // if (props.contentPath) parseContentPath(props.contentPath)
    parseContentPath()
    if (isLoggedIn.value) {
      accts.value = await getAccounts()
      username = await githubClient.value.user().then((userData:any) => userData.login)
      await githubClient.value.repos(username).then((repos:any[]) => {
        if (!repos.find(repo => repo.name === 'essays')) githubClient.value.createRepository({name:'essays', description:'Juncture visual essays'})
        if (!repos.find(repo => repo.name === 'media')) githubClient.value.createRepository({name:'media', description:'Juncture media'})
      })
      if (acct.value && repo.value && username) {
        githubClient.value.isCollaborator(acct.value, repo.value, username).then((isCollaborator:boolean) => userCanUpdateRepo.value = isCollaborator)
      }
    }
  })

  const accts = ref<any[]>([])
  const acct = ref('')
  watch(accts, () => {
    acct.value = acct.value || (accts.value.length > 0 ? accts.value[0].login : null)
  })
  watch(acct, (_acct, _prior) => {
    // console.log(`watch.acct=${_acct} prior=${_prior}`)
    if (_prior) repo.value = ''
    getRepositories().then(_repos => repos.value = _repos)
  })

  const repos = ref<any[]>([])
  const repo = ref('')
  watch(repos, () => {
    // console.log('watch.repos')
    if (!repo.value && repos.value.length > 0) {
      if (repos.value.length === 1) repo.value = repos.value[0].name
      else {
        let defaultForMode = props.mode === 'media' ? 'media' : 'essays'
        repo.value = repos.value.find(repo => repo.name === defaultForMode) ? defaultForMode : repos.value[0].name
      }
    }
  })

  const branches = ref<any[]>([])
  const branch = ref('')
  watch(repo, (_repo, _prior) => {
    // console.log(`watch.repo=${_repo} prior=${_prior}`)
    if (_prior) path.value = []
    updateDirList().then(_ => setContentPath())
    branch.value = ''
    if (repo.value) {
      if (isLoggedIn.value && acct.value) {
        githubClient.value.user().then((userData:any) => userData.login)
        .then((username:string) => repo.value ? githubClient.value.isCollaborator(acct.value, repo.value, username) : false)
        .then((isCollaborator:boolean) => userCanUpdateRepo.value = isCollaborator)
      }
      getBranches().then(_branches => branches.value = _branches)
    }
  })


  let defaultBranch: string
  watch(branches, async () => {
    if (!defaultBranch && acct.value && repo.value) defaultBranch = await githubClient.value.defaultBranch(acct.value, repo.value)
    if (defaultBranch) branch.value = defaultBranch
  })

  watch(branch, () => {
    // console.log(`watch.branch=${toRaw(branch.value)}`)
    if (branch.value && path.value) {
      if (pathIsDirectory) updateDirList().then(_ => setContentPath())
    }
  })

  const path = ref<string[]>([])
  watch(path, () => {
    // console.log(`watch.path=${toRaw(path.value)}`)
    if (branch.value) updateDirList().then(_ => setContentPath())
  })

  let pathIsDirectory: boolean = true
  const dirList = ref<any[]>([])
  watch(dirList, () => {
    pathIsDirectory = path.value.length === 0 || dirList.value.length > 0 
  })

  onMounted(() => {
    // console.log('onMounted', props)
    getAuthToken()
    window.addEventListener('storage', () =>  getAuthToken() )
    drawer = shadowRoot?.value?.querySelector('.workspace-selector')
  }) 

  // Ensure 'essays' repository exists
  let createSubmitted: boolean = false
  async function waitForRepoInit() {
    if (username && username === acct.value) {
      let repos = await githubClient.value.repos(acct.value)
      ready = repos.find((repo:any) => repo.name === 'essays') !== undefined
      // console.log(`waitForRepoInit: repo=${repo} repos=${repos.map((repo:any) => repo.name)} found=${ready} createSubmitted=${createSubmitted}`)
      if (!ready && !createSubmitted) {
        githubClient.value.createRepository({name:'essays', description:'Juncture visual essays'})
        githubClient.value.createRepository({name:'media', description:'Juncture media'})
        createSubmitted = true
        // notReadyText = 'Waiting for repository creation...'
      }
    } else {
      ready = true
      getRepositories()
    }
    if (!ready) setTimeout(() => waitForRepoInit(), 5000)
  }

  function parseContentPath(_contentPath:string='') {
    _contentPath = _contentPath || props.contentPath || ''
    // console.log('parseContentPath', _contentPath)
    if (_contentPath) {
      let [_path, _args] = _contentPath.split(':').pop()?.split('?') || []
      let qargs = _args ? Object.fromEntries(_args.split('&').map(arg => arg.split('='))) : {}
      let pathElems = _path.split('/').filter(pe => pe)
      if (pathElems.length > 0) acct.value = pathElems[0]
      if (pathElems.length > 1) repo.value = pathElems[1]
      if (pathElems.length > 2) path.value = pathElems.slice(2)
      if (qargs.ref) branch.value = qargs.ref || 'main'
      // console.log(`parseContentPath: acct=${acct.value} repo=${repo.value} ref=${branch.value} path=${path.value}`)
    }
  }

  function setContentPath() {
    // console.log('setContentPath', acct.value, repo.value, path.value)
    if (acct.value && repo.value) {
      let _contentPath = `gh:${acct.value}/${repo.value}`
      if (path.value.length > 0) _contentPath += `/${path.value.join('/')}`
      if (branch.value && branch.value !== defaultBranch) _contentPath += `?ref=${branch.value}`
      contentPath.value = _contentPath
    }
  }

  async function getUnscopedToken() {
    let url = `https://api.juncture-digital.org/gh-token`
    let resp = await fetch(url)
    if (resp.ok) {
      let unscopedToken = await resp.text()
      window.localStorage.setItem('gh-unscoped-token', unscopedToken)
    }
  }

  async function getAuthToken() {
    if (!window.localStorage.getItem('gh-unscoped-token')) await getUnscopedToken()
    authToken.value = window.localStorage.getItem('gh-auth-token') || window.localStorage.getItem('gh-unscoped-token')
    isLoggedIn.value = window.localStorage.getItem('gh-auth-token') !== null
  }

  async function getAccounts(): Promise<string[]> {
    return await Promise.all([githubClient.value.user(), githubClient.value.organizations()])
    .then(responses => responses.flat())
  }

  async function getRepositories(): Promise<string[]> {
    return githubClient.value.repos(acct.value)
  }

  async function getBranches(): Promise<string[]> {
    return githubClient.value.branches(acct.value, repo.value)
  }

  async function updateDirList() {
    dirList.value = []
    let _dirList:any[] = await githubClient.value.dirlist(acct.value, repo.value, path.value.join('/'), branch.value)
    //if (dirList.length === 0 && path.length > 0) dirList = await githubClient.dirlist(acct, repo, path.slice(0,-1).join('/'), ref)
    let dirs = _dirList.filter(item => item.type === 'dir')
    let files = _dirList.filter(item => item.type === 'file' && !igmore.has(item.name))
    if (useReadme && files.find(file => file.name === 'README.md') && dirs.length === 0) {
      if (path.value.length === 0 || path.value[path.value.length-1] !== 'README.md') path.value = [...path.value, `README.md`]
    }
    dirList.value = [...dirs, ...files]
  }

  function getDirList() {
    return dirList.value
  }

  function repositoryIsWriteable() {
    return userCanUpdateRepo.value
  }

  async function getFile(contentPath:string) {
    let [_path, _args] = contentPath.split(':').pop()?.split('?') || []
    let qargs = _args ? Object.fromEntries(_args.split('&').map(arg => arg.split('='))) : {}
    let pathElems = _path.split('/').filter(pe => pe)
    let [_acct, _repo] = pathElems.slice(0,2)
    _path = pathElems.slice(2).filter(pe => pe).join('/')
    return githubClient.value.getFile(_acct, _repo, _path, qargs.ref || branch.value)
  }

  async function putFile(contentPath:string, content:string) {
    let [_path, _args] = contentPath.split(':').pop()?.split('?') || []
    let qargs = _args ? Object.fromEntries(_args.split('&').map((arg:string) => arg.split('='))) : {}
    let pathElems = _path.split('/').filter((pe:string) => pe)
    let [_acct, _repo] = pathElems.slice(0,2)
    _path = pathElems.slice(2).filter((pe:string) => pe).join('/')
    let ref = qargs.ref || branch.value
    return githubClient.value.putFile(_acct, _repo, _path, content, ref)
  }

  function accountSelected(_acct:any) {
    acct.value = _acct.login
  }

  function repoSelected(_repo:any) {
    repo.value = _repo.name
  }

  function branchSelected(_branch:any) {
    branch.value = _branch.name
  }

  function appendPath(item: any) {
    drawer.hide()
    useReadme = true
    let newPath = [...path.value]
    if (!pathIsDirectory) newPath = newPath.slice(0,-1)
    if (newPath.length === 0 || newPath[newPath.length-1] !== item.name) newPath = [...newPath, item.name]
    // console.log('appendPath', path, pairectory, newPath)
    path.value = newPath
  }

  function prunePath(idx: number) {
    drawer.hide()
    // useReadme = idx === path.length - 2
    useReadme = false
    path.value = idx === 0 ? [] : path.value.slice(0,idx)
  }

  function onAddFileClicked(evt:Event) {
    if (props.mode === 'essays') showAddFileDialog()
    else emitAddEvent(evt)
  }

  function toTitleCase(str:string) {
    return str.toLowerCase().split('-').map(function (word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ')
  
  }
  function showAddFileDialog() {
    let form = (shadowRoot.value?.querySelector('#add-file-form') as HTMLFormElement)
    if (!form.onclick) {
      form.onclick = function () { }
      form.addEventListener('submit', async (evt) => {
        evt.preventDefault()
        let inputEl = (shadowRoot.value?.querySelector('#add-file-input') as HTMLInputElement)
        let newFilePathElems:string[] = [...path.value, ...inputEl.value.split('/').filter(pe => pe)]
        let essayName = newFilePathElems[newFilePathElems.length-1]
        if (newFilePathElems[newFilePathElems.length-1].indexOf('.') > 0) newFilePathElems[newFilePathElems.length-1] = newFilePathElems[newFilePathElems.length-1].replace(/readme\.md/,'README.md')
        else newFilePathElems.push('README.md')
        let _path = newFilePathElems.join('/')
        essayName = toTitleCase(essayName)
        await githubClient.value.putFile(acct.value, repo.value, _path, `# ${essayName}\n\n`, branch.value)
        path.value = newFilePathElems
        hideAddFileDialog()
      })
    }
    let dialog = shadowRoot.value?.querySelector('#add-file-dialog') as HTMLDialogElement
    dialog.addEventListener('sl-after-show', () => {
      (shadowRoot.value?.querySelector('#add-file-input') as HTMLInputElement).focus()
    })
    dialog.show()
  }

  function hideAddFileDialog() {
    (shadowRoot.value?.querySelector('#add-file-input') as HTMLInputElement).value = '';
    (shadowRoot.value?.querySelector('#add-file-dialog') as any).hide();
  }

  function showDeleteFileDialog() {
    let dialog = shadowRoot.value?.querySelector('#delete-file-dialog') as SLDIalog
    dialog.show()
  }

  function hideDeleteFileDialog() {
    let dialog = shadowRoot.value?.querySelector('#delete-file-dialog') as SLDIalog
    dialog.hide()
  }

  async function showAddRepoDialog() {
    let form = (shadowRoot.value?.querySelector('#add-repo-form') as HTMLFormElement)
    if (!form.onclick) {
      form.onclick = function () { }
      form.addEventListener('submit', async (evt) => {
        evt.preventDefault()
        let inputEl = shadowRoot.value?.querySelector('#add-repo-input') as HTMLInputElement
        let name = inputEl.value
        let resp = await githubClient.value.createRepository({name, org: username === acct.value ? null : acct.value })
        if (resp.status === 201) {
          getRepositories().then(_repos => {
            repo.value = name
            repos.value = _repos
          })
        }
        hideAddRepoDialog()
      })
    }
    let dialog = shadowRoot.value?.querySelector('#add-repo-dialog') as SLDIalog
    dialog.addEventListener('sl-after-show', () => {
      (shadowRoot.value?.querySelector('#add-repo-input') as HTMLInputElement).focus()
    })
    dialog.show()
  }

  function hideAddRepoDialog() {
    let dialog = shadowRoot.value?.querySelector('#add-repo-dialog') as SLDIalog
    dialog.hide();
    (shadowRoot.value?.querySelector('#add-repo-input') as HTMLInputElement).value = ''
  }

  async function deleteFile() {
    let toDelete = path.value.join('/')
    await githubClient.value.deleteFile(acct.value, repo.value, toDelete, branch.value)
    await updateDirList()
    prunePath(path.value.length-(dirList.value.length === 0 ? 2 : 1))
    fileToDelete.value = null
    hideDeleteFileDialog()
  }

  function dirItems() {
    return dirList.value.filter(item => item.type === 'dir' || (item.name.split('.').pop() === 'md' && props.mode === 'essays'))
  }

  function emitAddEvent(evt:Event) {
    emit('addMediaResource', evt)
  }

  function toggleDrawer() {
    if (drawer.open) drawer.hide()
    else drawer.show()
  }

</script>

<style src='../style.css'></style> 

<style>
* { box-sizing: border-box; }

:host {
  display: block;
  width: 100%;
  border: 1px solid #444;
  padding: 6px;
  z-index: 9;
  background-color: white;
}
span.path-elem {
  font-family: "Archivo Narrow", Roboto, sans-serif;
  font-size: 1.2rem;
}
.workspace {
  display: flex;
  align-items: center;
}
.workspace-selector {
  display: flex;
  gap: 12px;
}
.workspace-selector div {
  display: inline-flex;
  position: relative;
  padding-left: 6px;
  font-size: 1rem;
}
.selectors {
  display: flex;
  gap: 6px;
}
.ws-path {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  margin: 3px;
}
.workspace-selector > sl-icon {
  vertical-align: middle;
  padding-right: 6px;
}
sl-drawer::part(base), sl-drawer::part(panel), sl-drawer::part(body) {
  padding: 0;
  overflow: visible;
}

.github-select {
  font-weight: bold;
  font-size: 1.2em;
  color: #5A162E;
}

sl-divider {
  margin: 6px;
}
.values {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.values > div {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label {
  font-weight: bold;
}

.value {
  display: inline-block;
}

div.path {
}

sl-breadcrumb-item::part(label) {
  font-size: 1rem;
  color: var(--sl-color-primary-600);
}

.dir-items li {
  cursor: pointer;
}

.dir-items {
  height: 40vh;
  overflow-y: scroll;
}

.dir-items li:hover {
  color: var(--sl-color-primary-600);
}

sl-icon-button::part(base) {
  padding: 0;
}

.content-path {
  display: flex;
  flex-direction: column;
  /* gap: 12px; */
}

sl-icon-button {
  align-self: start;
  margin-top:6px;;
}

sl-menu::part(base) {
  max-height: 300px;
  overflow-y: scroll;
}

.dirs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dirs sl-button::part(base) {
  border-radius: 12px;
  font-weight: 500;
  font-family: "Archivo Narrow", Roboto, sans-serif;
  font-size: 1rem;
}

sl-button.dir::part(base) {
  background-color: #eee;
  /*
  background-color: rgba(91,21,46,.6);
  color: white;
  */
}

sl-button.file::part(base) {
}

sl-button.add-item::part(base) {
  background-color: #eee;
  color: black;
}

.delete {
  margin-left: 18px;
}

sl-icon-button.delete::part(base) {
  color: red;
}

.add-repo {
  background-color: #ddd;
}

sl-menu {
  text-align: left;
}

sl-breadcrumb {
  display: inline-block;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;;
}

</style>