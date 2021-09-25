// https://dev.to/lavikara/setup-vue-webpack-and-babel-boo
// https://stackoverflow.com/questions/65687607/what-is-the-correct-way-to-import-vuetify-components-individually

const glob = require("glob-promise")
const fs = require('fs').promises
const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, lstatSync, copyFileSync, symlinkSync, readlinkSync } = require('fs')
const path = require('path')
const { dirname, normalize, join, relative } = path

const EXTERNAL_DEP = ['axios', 'fetch', 'moment']
const VUETIFY_COMP_REGEX = /<(v\-[a-zA-Z\-]+)(“[^”]*”|'[^’]*’|[^'”>])*>/g

const CLIENT_FOLDER = __dirname + '/client'
const CLIENT_SOURCES = join(CLIENT_FOLDER, 'src')
const CLIENT_PAGES_FOLDER = join(CLIENT_FOLDER, 'pages')
const COMPONENT_PAGES = 'pages/**/*.js'
const INDEX_PAGE_NAME = 'index.html'
const INDEX_PAGE = join(__dirname, INDEX_PAGE_NAME)
const CLIENT_APP_COMPONENT = join(CLIENT_SOURCES, 'App.vue')
const MAIN_SCRIPT = join(__dirname, 'compliapp.js')
const CLIENT_MAIN_PAGE = join(CLIENT_SOURCES, 'main.js')
const RESOURCES = join(__dirname, 'resources')
const CLIENT_RESOURCES = join(CLIENT_SOURCES, 'resources')
const VALIDATOR = join(__dirname, 'validator.js')
const VALIDATOR_DEST = join(CLIENT_RESOURCES, 'validator.js')
const ASSETS_FOLDER = join(CLIENT_SOURCES, 'assets')
const ASSETS_TO_COPY = ['compliapp.css', 'Compliance.ttf']

let regexp, str
fs.rm(CLIENT_PAGES_FOLDER, { recursive: true, force: true })
.then(() => Promise.all([fs.mkdir(CLIENT_PAGES_FOLDER, { recursive: true }), glob(COMPONENT_PAGES)]))
.then(res => {
  let vuetifyComponentsNames
  res[1].forEach(compPath => {
    compPath = './' + compPath
    const newPath = join(CLIENT_SOURCES, compPath).replace('.js', '.vue')

    let file = readFileSync(compPath).toString()
    file = String(file)
    file = file.replace(/\/\*{1,2} *global.*\//g, '') // delete global pages

    // replace all includes with vue format
    file = file.replace(/(import\(.*\.)js/g, '$1vue')

    // find all vuetfy components
    vuetifyComponentsNames = {}
    regexp = VUETIFY_COMP_REGEX
    str = file
    let matches = str.matchAll(regexp);

    for (const match of matches) {
      let cmpName = match[1]
      vuetifyComponentsNames[cmpName] = cmpName
    }

    // export components
    vuetifyComponentsNames = Object.values(vuetifyComponentsNames)
    let capitalized = vuetifyComponentsNames.map(e => camelize(e))
    file = 'import { ' + capitalized.join(', ') + ' } from \'vuetify/lib\'\n\n' + file

    EXTERNAL_DEP.forEach(dep => {
      const re = new RegExp(dep, 'i')
      if(file.search(re) != -1) file = 'import ' + dep + ' from "' + dep + '";\n' + file // add axios
    })
    if(file.indexOf('Vue.') != -1) file = `import Vue from 'vue';\n` + file
    if(file.indexOf('d3.') != -1) file = `import * as d3 from 'd3';\n` + file
    if(file.indexOf('Prism.') != -1) file = `import * as Prism from 'prism';\n` + file
    if(file.indexOf('single(') != -1) file = `import single from '${relative(newPath, VALIDATOR_DEST).replace(/\\/g, '/').replace('../', '')}';\n` + file
    if(file.indexOf('textureSchema(') != -1) file = `import textureSchema from '${relative(newPath, VALIDATOR_DEST).replace(/\\/g, '/').replace('../', '')}';\n` + file

    // add to components
    let compObjMatch = file.match(/([\t ]*)components:\s*{/)
    if(compObjMatch === null) { // no components tag, add one
      const nameObjMatch = file.match(/([\t ]*)name:\s*.*,/)
      if(nameObjMatch !== null) {
        file = file.replace(nameObjMatch[0], nameObjMatch[0] + '\n' + nameObjMatch[1] + 'components: {\n' +  nameObjMatch[1] + '},\n')
        compObjMatch = file.match(/([\t ]*)components:\s*{/)
      }
    }
    if(compObjMatch != null) {
      file = file.replace(compObjMatch[0], compObjMatch[0] + '\n' + capitalized.map(e => compObjMatch[1] + '  ' + e).join(',\n') + ',')
    }

    // wrap with script tag
    file = "<script>\n" + file + "</script>"

    // extract template
    const templateMatch = file.match(/\n?([\t ]*)template:\s*\n?\s*`([^`]+)`\s*\n?\s*,/)
    if(templateMatch !== null){
      let [wholeMatch, templateIndent, templateContent] = templateMatch

      file = file.replace(wholeMatch, '') // delete inline template
      templateContent = templateContent.split('\n').map(e => e.replace(templateIndent, '')).join('\n') // remove additional indent
      file = '<template>\n' + templateContent + '\n</template>\n\n' + file
    }
    mkdirSync(dirname(newPath), { recursive: true })
    writeFileSync(newPath, file)
  })

  // main script
  let main = readFileSync(MAIN_SCRIPT).toString()
  main = main.replace(/\/\*{0,2} *global.*\n/g, '') // delete global pages
  main = `import './assets/compliapp.css';` + main
  main = `import '@mdi/font/css/materialdesignicons.css'\n` + main
  main  = 'import VueRouter from "vue-router";\n' + main
  main = `import App from './App.vue';\n` + main
  main  = 'import Vuetify from "@/plugins/vuetify";\n' + main
  main  = 'import Vue from "vue";\n' + main

  const dataMatch = main.match(/data((.|\n)*)vuetify/gm)
  const inside = dataMatch[0]
  main = main.replace(dataMatch[0], 'vuetify') // void all data

  const constDataMatch = main.match(/\/\/ convert-import(.|\n)*\/\/ convert-import\n/gm)
  let constDataInside = constDataMatch[0]
  main = main.replace(constDataMatch[0], '')

  // change all imports with vue format
  main = main.replace(/(import\(.*\.)js/g, '$1vue')
  main = main.trim() + `.$mount('#app')`
  main = main.replace(`\n}).$mount('#app')`, `,
  methods: {
    lang() {
      return this.$refs.app = this.$children[0].lang()
    }
  },\n
  created: function() {
    window.v = this.$root
  },
  render: h => h(App),
}).$mount('#app')\n`)
  main = main.replace(/\s+el:.*,/, '')
  writeFileSync(CLIENT_MAIN_PAGE, main)

    // extract index.html
  let indexPage = readFileSync(INDEX_PAGE).toString()

  const vApp = indexPage.match(/<v-app(.|\n)*<\/v-app>/g)[0]

  let appComp = readFileSync(CLIENT_APP_COMPONENT).toString()
  appComp = appComp.replace(/<template>\n(.|\n)*\n<\/template>/gm, '<template>\n' + vApp + '\n</template>')

  // inject data
  appComp = appComp.replace('}\n</script>', ',  ' + inside + '}\n</script>')


  appComp = appComp.replace('vuetify', '')

  // import vuetify components
  vuetifyComponentsNames = {}
  regexp = VUETIFY_COMP_REGEX
  str = appComp
  let matches = str.matchAll(regexp);

  for (const match of matches) {
    let cmpName = match[1]
    vuetifyComponentsNames[cmpName] = cmpName
  }

  // export components
  vuetifyComponentsNames = Object.values(vuetifyComponentsNames)
  let capitalized = vuetifyComponentsNames.map(e => camelize(e))

  // inject const data
  constDataInside = constDataInside.replace(/const ([a-zA-Z]+) = \(\) => import\('(.*)js'\)/gm, `import $1 from '$2vue'`)
  appComp = appComp.replace('<script>\n', '<script>\n' + constDataInside)
  appComp = appComp.replace('<script>\n', '<script>\n' + 'import * as marked from "marked";\n')
  appComp = appComp.replace('<script>\n', '<script>\n' + 'import axios from "axios";\n')
  appComp = appComp.replace('<script>\n', '<script>\n' + 'import { ' + capitalized.join(', ') + ' } from \'vuetify/lib\'\n')
  appComp = appComp.replace('<script>\n', '<script>\n' + 'import Vue from "vue";\n')

  appComp = appComp.replace('components: {}', `components: {
${ capitalized.map(e => '    ' + e).join(',\n') }
  }`)

  writeFileSync(CLIENT_APP_COMPONENT, appComp)

  // copy resources
  copyFolderSync(RESOURCES, CLIENT_RESOURCES)

  // copy validator
  copyFileSync(VALIDATOR, VALIDATOR_DEST)
  
  ASSETS_TO_COPY.forEach(asset => {
    copyFileSync(asset, join(ASSETS_FOLDER, asset))
  })
})

function camelize(str){
  let arr = str.split('-');
  let capital = arr.map((item, index) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
  // ^-- change here.
  let capitalString = capital.join("");

  return capitalString
}

function copyFolderSync(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest)

  readdirSync(src).forEach(dirent => {
    const [srcPath, destPath] = [src, dest].map(dirPath => path.join(dirPath, dirent))
    const stat = lstatSync(srcPath)

    switch (true) {
      case stat.isFile():
        copyFileSync(srcPath, destPath); break
      case stat.isDirectory():
        copyFolderSync(srcPath, destPath); break
      case stat.isSymbolicLink():
        symlinkSync(readlinkSync(srcPath), destPath); break
    }
  })
}
