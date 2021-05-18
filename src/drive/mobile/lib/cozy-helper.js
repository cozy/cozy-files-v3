/* global cozy */
import { LocalStorage as Storage } from 'cozy-client-js'
import CozyClient, { StackLink } from 'cozy-client'
import PouchLink from 'cozy-pouch-link'
import { isMobileApp, getDeviceName } from 'cozy-device-helper'
import { SOFTWARE_ID, SOFTWARE_NAME } from './constants'
import { disableBackgroundService } from './background'
import { schema, DOCTYPE_FILES } from 'drive/lib/doctypes'
import appMetadata from 'drive/appMetadata'
import { getRedirectUri } from 'drive/mobile/lib/redirect'
import {
  buildRecentQuery,
  buildDriveQuery,
  buildFolderQuery
} from 'drive/web/modules/queries'

export const getLang = () =>
  navigator && navigator.language ? navigator.language.slice(0, 2) : 'en'

export const getOauthOptions = () => {
  return {
    redirectURI: getRedirectUri(appMetadata.slug),
    softwareID: SOFTWARE_ID,
    clientName: `${SOFTWARE_NAME} (${getDeviceName()})`,
    softwareVersion: appMetadata.version,
    clientKind: 'mobile',
    clientURI: 'https://github.com/cozy/cozy-drive/',
    logoURI:
      'https://github.com/cozy/cozy-drive/raw/master/targets/drive/vendor/assets/oauth-app-icon.png',
    policyURI: 'https://files.cozycloud.cc/cgu.pdf'
  }
}

export const initClient = url => {
  const stackLink = new StackLink()

  const pouchLinkOptions = {
    doctypes: [DOCTYPE_FILES],
    doctypesReplicationOptions: {
      [DOCTYPE_FILES]: {
        strategy: 'fromRemote',
        warmupQueries: [
          buildDriveQuery({
            currentFolderId: 'io.cozy.files.root-dir',
            type: 'directory',
            sortAttribute: 'name',
            sortOrder: 'asc'
          }),
          buildRecentQuery(),
          buildFolderQuery('io.cozy.files.root-dir')
        ]
      }
    },
    initialSync: true
  }

  if (isMobileApp()) {
    pouchLinkOptions.pouch = {
      plugins: [require('pouchdb-adapter-indexeddb').default],
      options: {
        adapter: 'indexeddb',
        location: 'default'
      }
    }
  }

  const pouchLink = new PouchLink(pouchLinkOptions)

  return new CozyClient({
    uri: url,
    oauth: getOauthOptions(),
    appMetadata,
    schema,
    links: [pouchLink, stackLink],
    store: false
  })
}

export const initBar = async client => {
  // Prevents the bar to be initialized 2 times in a row after the onboarding
  if (document.getElementById('coz-bar')) {
    return
  }
  await cozy.bar.init({
    appName: 'Drive',
    appNamePrefix: 'Cozy',
    appSlug: 'drive',
    cozyClient: client,
    iconPath: require('../../targets/vendor/assets/app-icon.svg'),
    lang: getLang(),
    cozyURL: client.uri,
    replaceTitleOnMobile: false,
    displayOnMobile: true
  })
}

export const restoreCozyClientJs = (uri, clientInfos, token) => {
  const offline = { doctypes: ['io.cozy.files'] }
  cozy.client.init({
    cozyURL: uri,
    oauth: {
      storage: new Storage(),
      clientParams: {
        ...clientInfos,
        scopes: token.scope
      }
    },
    offline
  })

  cozy.client.saveCredentials(clientInfos, token)
}

export function resetClient(client, clientInfo = null) {
  if (clientInfo && cozy.client.auth.unregisterClient) {
    cozy.client.auth.unregisterClient(clientInfo)
  }
  // reset cozy-bar
  if (document.getElementById('coz-bar')) {
    document.getElementById('coz-bar').remove()
  }
  // reset pouchDB
  if (cozy.client.offline.destroyAllDatabase) {
    cozy.client.offline.destroyAllDatabase()
  }
  // reset cozy-client
  client.getStackClient().resetClient()
  // reset cozy-client-js
  if (cozy.client._storage) {
    cozy.client._storage.clear()
  }

  disableBackgroundService()
}

export const getToken = async () => {
  const credentials = await cozy.client.authorize()
  return credentials.token.accessToken
}

export const getClientUrl = () => cozy.client._url
