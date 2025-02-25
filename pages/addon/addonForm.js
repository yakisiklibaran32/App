/* global Vue, axios, marked */
const UserList = () => import('./userlist.js')
const ImagePreviewer = () => import('./image-previewer.js')
const FullscreenPreview = () => import('./fullscreen-preview.js')

export default {
  name: 'addon-form',
  components: {
    UserList,
    ImagePreviewer,
    FullscreenPreview
  },
  props: {
    addonNew: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    addonData: {
      required: false,
      default: () => undefined
    },
    headerSource: {
      required: false,
      default: () => undefined
    },
    screenSources: {
      required: false
    }
  },
  template: `
  <v-container>
    <fullscreen-preview
      ref="headerPreview"
      :src="header"
    />

    <div class="text-center" v-if="loading">
      <h2 v-text="$root.lang().addons.general.loading_addon" class="mb-3"></h2>
      <v-progress-circular
        :size="70"
        :width="7"
        color="blue"
        indeterminate
      ></v-progress-circular>
    </div>
    <v-list v-else :class="['main-container', 'my-2', {'mx-n3': !$vuetify.breakpoint.mdAndUp }]" :rounded="$vuetify.breakpoint.mdAndUp" two-line>
      <v-form lazy-validation v-model="validForm" ref="form" style="padding: 0 6px">

        <div class="container">
          <div class="row">
            <!-- LEFT PART : INPUT -->
            <div class="col pb-0">
              <div class="text-h5">{{ $root.lang().addons.general.title }}</div>
              <!-- Addon name -->
              <v-text-field
                required
                clearable
                v-model="submittedForm.name"
                :rules="form.name.rules"
                :counter="form.name.counter.max"
                :label="$root.lang().addons.general.name.label"
                :hint="$root.lang().addons.general.name.hint"
              />

              <div class="pt-5">
                <v-file-input
                  dense
                  show-size
                  small-chips
                  :counter="addonNew ? 1 : undefined"
                  prepend-icon="mdi-image"
                  v-model="submittedForm.headerFile"
                  accept="image/jpg, image/jpeg, image/png, image/gif"
                  :label="$root.lang().addons.images.header.labels.drop"
                  :rules="headerRules"
                  ref="headerInput"
                  v-on:change="headerChange"
                  :on-error="o => $root.showSnackBar(o.message, o.colour)"
                />
              </div>
            </div>
            <!-- RIGHT PART: HEADER IMAGE PREVIEW -->
            <div class="col-12 col-sm-3 d-flex px-0 pt-0 align-center" v-if="hasHeader">
              <div class="col">
                <div style="position: relative">
                  <v-img
                    @click.stop="(e) => $refs.headerPreview.open()"
                    style="border-radius: 10px"
                    :aspect-ratio="16/9"
                    :src="header"
                  />
                  <v-card v-if="!addonNew" class="ma-2" rounded style="display: inline-block; position: absolute; right: 0; top: 0;">
                    <v-icon small class="ma-1" @click.stop="(e) => $refs.headerPreview.open()">
                      mdi-fullscreen
                    </v-icon><v-icon small class="ma-1" @click="$emit('header', undefined, true)">
                      mdi-delete
                    </v-icon>
                  </v-card>
                </div>
              </div>
            </div>
          </div>

          <div class="text-h5 mb-3">{{ $root.lang().addons.images.title }}</div>

          <!-- upload field for images -->
          <ImagePreviewer :sources="carouselSources" @item-delete="onDeleteCarousel" />

          <div class="pt-5">
            <v-file-input
              dense
              show-size
              multiple
              small-chips
              prepend-icon="mdi-image"
              v-model="submittedForm.carouselFiles"
              accept="image/jpg, image/jpeg, image/png, image/gif"
              :label="$root.lang().addons.images.carousel.labels.drop"
              :rules="carouselRules"
              :on-error="o => $root.showSnackBar(o.message, o.colour)"
              v-on:change="carouselChange"
              ref="carouselInput"
            />
          </div>

        <div class="text-h5">{{ $root.lang().addons.titles.details }}</div>

        <!-- Addon description -->
        <v-textarea
          clearable
          v-model="submittedForm.description"
          :rules="form.description.rules"
          :counter="form.description.counter.max"
          :label="$root.lang().addons.general.description.label"
          :hint="$root.lang().addons.general.description.hint"
        />

        <!-- Addon description preview -->
        <v-container
          id="addon-description-preview"
          v-if="submittedForm.description && submittedForm.description.length > 0"
          class="markdown"
          style="background-color: rgba(33,33,33,1); border-radius: 5px;"
          v-html="$root.compiledMarkdown(submittedForm.description)"
        />

        <!-- Addon authors selection -->
        <user-list 
          v-model="submittedForm.authors"
          :label="$root.lang().addons.general.authors.label"
          :hint="$root.lang().addons.general.authors.hint"
        />

        <div class="container" id="type-checkbox">
          <div class="row text-center">
            <div class="col-12 col-md-6">
              <v-row>
                <v-col
                  cols="6"
                  v-for="type in editions"
                  :key="type"
                >
                  <v-checkbox
                    v-model="submittedForm.selectedEditions"
                    :label="type"
                    :disabled="submittedForm.selectedEditions.length === 1 && submittedForm.selectedEditions[0] === type"
                    :value="type"
                    :hide-details="$vuetify.breakpoint.smAndDown"
                    color="primary"
                  />
                </v-col>
              </v-row>
            </div><div class="col-12 col-md-6">
              <v-row>
                <v-col
                  cols="6"
                  v-for="type in res"
                  :key="type"
                >
                  <v-checkbox
                    v-model="submittedForm.selectedRes"
                    :label="type"
                    :disabled="submittedForm.selectedRes.length === 1 && submittedForm.selectedRes[0] === type"
                    :value="type"
                    color="primary"
                  />
                </v-col>
              </v-row>
            </div>
          </div>
        </div>

        <div class="text-h5">{{ $root.lang().addons.options.title }}</div>

        <div class="container">
          <v-row>
              <v-checkbox
                class="col-6"
                v-model="submittedForm.options.comments"
                :label="$root.lang().addons.options.comments.label"
                color="primary"
              />
              <v-checkbox
                class="col-6"
                v-model="submittedForm.options.optifine"
                :label="$root.lang().addons.options.optifine.label"
                color="primary"
              />
          </v-row>
        </div>

        <div class="text-h5">{{ $root.lang().addons.downloads.title }}</div>

        <div>
          <v-row v-for="(obj,index) in submittedForm.downloads" :key="index" style="margin-top: 0">
            <v-col cols="3">
              <v-text-field
                clearable
                :placeholder="$root.lang().addons.downloads.name.placeholder"
                :label="$root.lang().addons.downloads.name.label"
                v-model="obj.key"
                :rules="downloadTitleRules"
              ></v-text-field>
            </v-col>
            <v-col cols="9">
              <v-row 
                v-for="(link, indexLinks) in obj.links"
                :key="indexLinks"
                :style="{
                  'align-items': 'baseline',
                  'margin-top': indexLinks != 0 ? '-32px' : '-12px'
                }"
              >
                <v-col>
                  <v-text-field
                    clearable
                    :placeholder="$root.lang().addons.downloads.link.placeholder"
                    :label="$root.lang().addons.downloads.link.label"
                    v-model="obj.links[indexLinks]"
                    :rules="downloadLinkRules"
                  ></v-text-field>
                </v-col>
                <v-col v-if="indexLinks == 0" class="flex-grow-0 flex-shrink-0">
                  <v-btn icon @click="linkAdd(index)">
                    <v-icon color="lighten-1">mdi-plus</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-else class="flex-grow-0 flex-shrink-0">
                  <v-btn icon @click="linkRemove(index, indexLinks)">
                    <v-icon color="red lighten-1">mdi-minus</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="index != 0 && indexLinks == 0" class="flex-grow-0 flex-shrink-0">
                  <v-btn icon @click="downloadRemove(index)">
                    <v-icon color="red lighten-1">mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </div>
        <div class="pb-3">
          <v-btn block @click="downloadAdd()">
            {{ $root.lang().global.btn.add_download }} <v-icon color="white lighten-1">mdi-plus</v-icon>
          </v-btn>
        </div>       

        <div class="text-center">
          <v-btn :disabled="!validForm" @click="onSubmit" color="primary">
            {{ $root.lang().global.btn.submit }}
          </v-btn>
        </div>
      </v-form>
    </v-list>
  </v-container>
  `,
  data() {
    return {
      form: {
        files: {
          header: {
            rules: [
              header => !!header || this.$root.lang().addons.images.header.rules.image_required,
              header => (header && header.size < this.form.files.header.counter.max) || this.$root.lang().addons.images.header.rules.image_size.replace('%s', this.form.files.header.counter.max / 1000)
            ],
            counter: {
              max: 500000
            }
          },
          carousel: {
            rules: [
              (files) => { return files.map(file => (file.size < this.form.files.carousel.counter.max) || this.$root.lang().addons.images.header.rules.image_size.replace('%s', this.form.files.header.counter.max / 1000)).filter(r => typeof r === "string")[0] || true }
            ],
            counter: {
              max: 500000
            }
          },
          value: ''
        },
        description: {
          rules: [
            desc => !!desc || this.$root.lang().addons.general.description.rules.description_required,
            desc => (desc && desc.length <= this.form.description.counter.max) || this.$root.lang().addons.general.description.rules.description_too_big.replace('%s', this.form.description.counter.max),
            desc => (desc && desc.length >= this.form.description.counter.min) || this.$root.lang().addons.general.description.rules.description_too_small.replace('%s', this.form.description.counter.min),
          ],
          counter: {
            min: 32,
            max: 4096
          }
        },
        name: {
          rules: [
            name => !!name || this.$root.lang().addons.general.name.rules.name_required,
            name => (name && name.length <= this.form.name.counter.max) || this.$root.lang().addons.general.name.rules.name_too_big.replace('%s', this.form.name.counter.max),
            name => (name && name.length >= this.form.name.counter.min) || this.$root.lang().addons.general.name.rules.name_too_small.replace('%s', this.form.name.counter.min),
          ],
          counter: {
            min: 5,
            max: 30
          },
        },
        slug: {
          rules: [
            input => !!input || this.$root.lang().addons.general.slug.rules.required,
            input => (input && input.length <= this.form.slug.counter.max) || this.$root.lang().addons.general.slug.rules.too_big.replace('%s', this.form.slug.counter.max),
            input => (input && input.length >= this.form.slug.counter.min) || this.$root.lang().addons.general.slug.rules.too_small.replace('%s', this.form.slug.counter.min),
            input => /^[a-zA-Z0-9\-]+$/.test(input) || this.$root.lang().addons.general.slug.rules.incorrect_format
          ],
          counter: {
            min: 5,
            max: 30
          },
        }
      },
      submittedForm: {
        name: '',
        headerFile: undefined,
        carouselFiles: [],
        description: '',
        downloads: [{
          key: '',
          links: ['']
        }],
        authors: [],
        selectedEditions: ['Java'],
        selectedRes: ['32x'],
        options: {
          tags:[],
          comments: true,
          optifine: false
        }
      },
      headerValid: false,
      headerValidating: false,
      headerError: "",
      carouselValid: true,
      carouselValidating: false,
      carouselError: "",
      carouselDoNotVerify: false,
      downloadTitleRules: [
        u => !!u || this.$root.lang().addons.downloads.name.rules.name_required,
        u => u !== ' ' || this.$root.lang().addons.downloads.name.rules.name_cannot_be_empty
      ],
      downloadLinkRules: [
        u => this.validURL(u) || this.$root.lang().addons.downloads.link.rule
      ],
      validForm: false,
      editions: ['Java', 'Bedrock'],
      res: ['32x', '64x']
    }
  },
  computed: {
    hasHeader: function () {
      return !!(this.header || this.headerURL)
    },
    header: function () {
      return this.addonNew ?
        (this.headerValidating == false && this.headerValid && this.submittedForm.headerFile ?
          URL.createObjectURL(this.submittedForm.headerFile) : undefined) : 
        (this.headerSource ? this.headerSource : undefined)
    },
    carouselSources: function () {
      return this.addonNew ? 
        (this.carouselValidating === false && this.carouselValid && this.submittedForm.carouselFiles.length ?
          this.submittedForm.carouselFiles.map(file => URL.createObjectURL(file)) : []) :
        (this.screenSources ? this.screenSources : [])
    },
    headerValidSentence: function () {
      if (this.headerValidating) {
        return "Header being verified..."
      } else if (this.headerValid) {
        return true
      }

      return this.headerError
    },
    headerRules: function () {
      if(!this.addonNew) return []
      return [...this.form.files.header.rules, this.headerValidSentence]
    },
    headerFile: function () {
      return this.submittedForm.headerFile
    },
    carouselFiles: function() {
      return this.submittedForm.carouselFiles
    },
    carouselRules: function () {
      return [...this.form.files.carousel.rules, this.carouselValidSentence]
    },
    carouselValidSentence: function () {
      if (this.carouselValidating) {
        return "Carousel being verified..."
      } else if (this.carouselValid) {
        return true
      }

      return this.carouselError
    },
    submittedData: function () {
      let res = Object.merge({}, this.submittedForm)

      res.options.tags = [...res.selectedEditions, ...res.selectedRes]
      delete res.selectedEditions
      delete res.selectedRes

      // we treat files with different endpoint
      delete res.headerFile
      delete res.carouselFiles

      return res
    }
  },
  methods: {
    carouselChange: function() {
      if (this.carouselDoNotVerify) return

      const files = this.submittedForm.carouselFiles
      if(!files || files.length == 0) return

      this.carouselValidating = true
      Promise.all(files.map(f => this.verifyImage(f, this.validateRatio)))
        .then(() => {
          this.carouselValid = true
          this.$emit('screenshot', files)
          if(!this.addonNew) {
            this.submittedForm.carouselFiles = []
            this.$refs.carouselInput.value = []
          }
          this.$refs.carouselInput.blur()
        })
        .catch((error) => {
          console.error(error)
          this.carouselValid = false
          this.carouselError = error.message
        })
        .finally(() => {
          this.carouselValidating = false
        })
    },
    headerChange: function(file) {
      // delete not uploaded file
      if(!file) {
        if(this.addonNew) {
          this.$emit('header', undefined, true)
        }
        return
      }

      // activate validation loading
      this.headerValidating = true

      this.verifyImage(file, this.validateRatio)
        .then(() => {
          this.headerValid = true
          this.$emit('header', file)
          if(!this.addonNew) {
            this.submittedForm.headerFile = undefined
            this.$refs.headerInput.value = null
            this.$refs.headerInput.blur()
          }
        })
        .catch((error) => {
          this.headerValid = false
          this.headerError = error.message
          console.error(error)
          
          // input is changed so we delete parent component value
          if(this.addonNew) this.$emit('header', undefined, true)
          // if not addon new will delete file

          this.$root.showSnackBar(error.message, 'error')
        })
        .finally(() => {
          this.headerValidating = false
        })
    },
    downloadAdd: function () {
      this.submittedForm.downloads.push({ key: '', links: [''] })
    },
    downloadRemove: function (download_index) {
      this.submittedForm.downloads.splice(download_index, 1)
    },
    linkAdd: function(download_index) {
      this.submittedForm.downloads[download_index].links.push('')
    },
    linkRemove: function(download_index, link_index) {
      this.submittedForm.downloads[download_index].links.splice(link_index, 1)
    },
    onDeleteCarousel: function (item, index) {
      this.carouselDoNotVerify = true
      this.submittedForm.carouselFiles.splice(index, 1)
      this.$emit('screenshot', undefined, index, true)
      Vue.nextTick(() => {
        this.carouselDoNotVerify = false
      })
    },
    onSubmit: function() {
      const valid = this.$refs.form.validate()

      if(!valid) return

      this.$emit('submit', this.submittedData)
    },
    validateRatio: function (ctx) {
      const ratio = (ctx.width / ctx.height).toFixed(2) == 1.78
      if (!ratio) throw new Error(this.$root.lang().addons.images.header.rules.image_ratio)
    },
    validURL: function (str) {
      const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
      return !!pattern.test(str)
    },
    verifyImage: function (file, validateImage) {
      if (validateImage === undefined) validateImage = this.validateRatio

      return new Promise((resolve, reject) => {
        // start reader
        const reader = new FileReader()

        reader.onload = function (e) {
          const image = new Image()
          image.src = e.target.result
          image.onload = function () {
            try {
              validateImage(this)
              resolve()
            } catch (error) {
              reject(error)
            }
          }
          image.onerror = function (error) {
            reject(e)
          }
        }
        reader.onerror = function (error) {
          reject(e)
        }

        // set file to be readt
        reader.readAsDataURL(file)
      })
    }
  },
  watch: {
    addonData: {
      handler(data) {
        if(!this.addonNew && data) {
          data = JSON.parse(JSON.stringify(data))
          data.headerFile = undefined
          data.carouselFiles = []
          data.selectedRes = data.options.tags.filter(e => this.res.includes(e))
          data.selectedEditions = data.options.tags.filter(e => this.editions.includes(e))
          this.submittedForm = data
        }
      },
      immediate: true,
      deep: true
    }
  },
  beforeMount: function() {
    this.submittedForm.authors = [this.$root.user.id]
  }
}