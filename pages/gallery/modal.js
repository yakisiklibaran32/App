/* global axios, Vue */

export default {
  name: 'texture-modal',
  template: `
    <v-dialog
      v-model="opened"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
      @click.stop="closeModal"
    >

      <v-card>
        <v-toolbar
          dark
        >
          <v-btn
            icon
            dark
            @click="closeModal"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          
          <template v-if="Object.keys(textureObj).length > 0">
            <v-toolbar-title>[#{{ textureID }}] {{ textureObj.texture.name }}</v-toolbar-title>
          </template>
          <template v-else>
            <v-toolbar-title>Loading...</v-toolbar-title>
          </template>
        </v-toolbar>

        <template v-if="Object.keys(textureObj).length > 0">

          <div class="gallery-dialog-container">
            <div class="gallery-dialog-textures">
              <template v-for="res in resolutions">
                <div class="gallery-dialog-texture-container">
                  <div class="gallery-dialog-texture">
                    <img onerror="this.onerror=null;this.src='https://database.compliancepack.net/images/bot/error.png';" class="texture-img" :src="getTextureURL(res)" lazy-src="https://database.compliancepack.net/images/bot/loading.gif" />
                    <v-img contain style="position: absolute; z-index: -1;" class="texture-background" src="https://raw.githubusercontent.com/Compliance-Resource-Pack/Website/master/image/background/transparency_16x.png" />
                  </div>
                  <h2>{{ res }}</h2>
                </div>
              </template>
            </div>

            <div style="width: 70%; padding: 30px">
              <v-tabs
                v-model="tab"
                align-with-title
              >
                <v-tabs-slider color="white"></v-tabs-slider>

                <v-tab
                  v-for="item in items"
                  :key="item"
                  style="text-transform: uppercase"
                >
                  {{ item }}
                </v-tab>
              </v-tabs>

              <v-tabs-items v-model="tab">
                <v-tab-item
                  v-for="item in items"
                  :key="item"
                >
                  <template v-if="item === items[0]">
                    <template v-for="i in infos">
                      <div style="padding: 15px">
                        <h2 style="text-transform: capitalize;">{{ i }}</h2>
                        <v-data-table
                          dense
                          :headers="getHeaders(i)"
                          :items="getItems(i)"
                          class="elevation-1"
                          style="margin-top: 10px"
                          hide-default-footer
                        ></v-data-table>
                      </div>
                    </template>
                  </template>
                  <div v-if="item === items[1]" class="double_table">
                    <template v-for="i in authors">
                      <div style="padding: 15px">
                        <h2 style="text-transform: capitalize;">{{ i }}</h2>
                        <v-data-table
                          dense
                          :headers="getHeaders(i)"
                          :items="getItems(i)"
                          class="elevation-1"
                          style="margin-top: 10px"
                          hide-default-footer
                        ></v-data-table>
                      </div>
                    </template>
                  </div>
                  <div v-if="item === items[2]">
                    SoonTM
                  </div>
                  <div v-if="item === items[3]">
                    SoonTM
                  </div>
                </v-tab-item>
              </v-tabs-items>
            </div>
          </div>
        </template>
      </v-card>

    </v-dialog>
  `,
  props: {
    opened: {
      type: Boolean,
      required: true
    },
    closeModal: {
      type: Function,
      required: true
    },
    textureID: {
      type: String,
      required: true
    },
    textureObj: {
      type: Object,
      required: true
    },
    contributors: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      resolutions: ['16x', ...settings.resolutions],
      tab: null,
      items: ['information', 'authors', 'Animated', '3D'],
      infos: ['texture', 'uses', 'paths'],
      authors: settings.resolutions
    }
  },
  methods: {
    discordIDtoName(d) {
      return this.contributors[d].username || this.$root.lang().gallery.error_message.user_not_found
    },
    timestampToDate(t) {
      const a = new Date(t)
      const months = [this.$root.lang().global.months.jan, this.$root.lang().global.months.feb, this.$root.lang().global.months.mar, this.$root.lang().global.months.apr, this.$root.lang().global.months.may, this.$root.lang().global.months.jun, this.$root.lang().global.months.jul, this.$root.lang().global.months.aug, this.$root.lang().global.months.sep, this.$root.lang().global.months.oct, this.$root.lang().global.months.nov, this.$root.lang().global.months.dec]
      const year = a.getFullYear()
      const month = months[a.getMonth()]
      const date = a.getDate().toString().length == 1 ? `0${a.getDate()}` : a.getDate()
      return `${month} ${date}, ${year}`
    },
    getItems(item) {
      let output = []

      switch (item) {
        case this.authors[0]:
        case this.authors[1]:
          return this.textureObj.contributions.filter(el => el.res.includes(parseInt(item, 10))).map(el => {
            return {
              date: this.timestampToDate(el.date),
              contributors: el.contributors.map(el => this.discordIDtoName(el)).join(',\n')
            }
          })

        case this.infos[0]:
          return [this.textureObj[item]]
        case this.infos[1]:
          return Object.values(this.textureObj[item])

        case this.infos[2]:
          this.textureObj[item].forEach(paths => {
            paths.forEach(path => output.push(path))
          })

          return output
      }
    },
    getHeaders(item) {
      switch (item) {
        case this.authors[0]:
        case this.authors[1]:
          return [
            {
              text: "Date",
              value: "date"
            },
            {
              text: "Author(s)",
              value: "contributors"
            }
          ]
        case this.infos[0]:
          return [
            {
              text: 'ID',
              value: 'id',
              sortable: false
            },
            {
              text: 'Name',
              value: 'name',
              sortable: false
            },
            {
              text: 'Tags/Types',
              value: 'type',
              sortable: false
            }
          ]
        case this.infos[1]:
          return [
            {
              text: 'Use ID',
              value: 'id'
            },
            {
              text: 'Use Name',
              value: 'textureUseName'
            },
            {
              text: 'Edition(s)',
              value: 'editions'
            },
            {
              text: 'Texture ID',
              value: 'textureID'
            }
          ]

        case this.infos[2]:
          return [
            {
              text: 'Path ID',
              value: 'id'
            },
            {
              text: 'Resource Pack Path',
              value: 'path'
            },
            {
              text: 'Minecraft Versions',
              value: 'versions'
            },
            {
              text: 'Use ID',
              value: 'useID'
            }
          ]
      }


    },
    getTextureURL(res) {
      const path = this.textureObj.paths[0][0]

      switch (path.path.startsWith('assets')) {
        case false:
          if (res === '16x') return `https://raw.githubusercontent.com/CompliBot/Default-Bedrock/${path.versions[0]}/${path.path}`
          return `https://raw.githubusercontent.com/Compliance-Resource-Pack/Compliance-Bedrock-${res}/Jappa-${path.versions[0]}/${path.path}`

        default:
          if (res === '16x') return `https://raw.githubusercontent.com/CompliBot/Default-Java/${path.versions[0]}/${path.path}`
          return `https://raw.githubusercontent.com/Compliance-Resource-Pack/Compliance-Java-${res}/Jappa-${path.versions[0]}/${path.path}`
      }
    }
  }
}