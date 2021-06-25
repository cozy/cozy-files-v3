import React from 'react'
import { withClient } from 'cozy-client'

import FuzzyPathSearch from '../FuzzyPathSearch'
import { getFileMimetype } from 'drive/lib/getFileMimetype'

const TYPE_DIRECTORY = 'directory'

class SuggestionProvider extends React.Component {
  componentDidMount() {
    const { intent } = this.props
    this.hasIndexedFiles = false

    // re-attach the message listener for the intent to receive the suggestion requests
    window.addEventListener('message', event => {
      if (event.origin !== intent.attributes.client) return null
      const { query, id } = event.data
      // sometimes we get messages with undefined query & id, no idea why
      if (query && id) {
        this.provideSuggestions(query, id, intent)
      }
    })
  }

  async provideSuggestions(query, id, intent) {
    if (!this.hasIndexedFiles) {
      await this.indexFiles()
    }

    const searchResults = this.fuzzyPathSearch.search(query)

    window.parent.postMessage(
      {
        type: `intent-${intent._id}:data`,
        id,
        suggestions: searchResults.map(result => ({
          id: result.id,
          title: result.name,
          subtitle: result.path,
          term: result.name,
          onSelect: 'open:' + result.url,
          icon: result.icon
        }))
      },
      intent.attributes.client
    )
  }

  // fetches pretty much all the files and preloads FuzzyPathSearch
  async indexFiles() {
    return new Promise(async resolve => {
      const { client } = this.props
      const resp = await client.collection('io.cozy.files').all({ limit: null })
      const files = resp.rows
        .filter(row => !row.doc.hasOwnProperty('views'))
        .map(row => ({ id: row.id, ...row.doc }))

      const folders = files.filter(file => file.type === TYPE_DIRECTORY)

      const notInTrash = file =>
        !file.trashed && !/^\/\.cozy_trash/.test(file.path)
      const notOrphans = file =>
        folders.find(folder => folder._id === file.dir_id) !== undefined

      const normalizedFiles = files
        .filter(notInTrash)
        .filter(notOrphans)
        .map(file => {
          const isDir = file.type === TYPE_DIRECTORY
          const dirId = isDir ? file._id : file.dir_id
          const urlToFolder = `${window.location.origin}/#/folder/${dirId}`

          let path, url
          if (isDir) {
            path = file.path
            url = urlToFolder
          } else {
            const parentDir = folders.find(folder => folder._id === file.dir_id)
            path = parentDir && parentDir.path ? parentDir.path : ''
            url = `${urlToFolder}/file/${file._id}`
          }

          return {
            id: file._id,
            name: file.name,
            path,
            url,
            icon: getIconUrl(file)
          }
        })

      this.fuzzyPathSearch = new FuzzyPathSearch(normalizedFiles)
      this.hasIndexedFiles = true
      resolve()
    })
  }

  render() {
    return null
  }
}

const iconsContext = require.context(
  'drive/assets/icons/',
  false,
  /icon-type-.*.svg$/
)

const icons = iconsContext.keys().reduce((acc, item) => {
  acc[item.replace(/\.\/icon-type-(.*)\.svg/, '$1')] = iconsContext(item)
  return acc
}, {})

function getIconUrl(file) {
  const keyIcon =
    file.type === TYPE_DIRECTORY
      ? 'folder'
      : getFileMimetype(icons)(file.mime, file.name) || 'files'

  const icon = icons[keyIcon].default

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='${
    icon.viewBox
  }'>${icon.content}<use href='#${
    icon.id
  }' x='0' y='0' width='32' height='32'/></svg>`.replace(/#/g, '%23')
}

export default withClient(SuggestionProvider)
