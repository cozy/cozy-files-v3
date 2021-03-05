/* global cozy */

import memoize from 'lodash/memoize'
import { initTranslation } from 'cozy-ui/transpiled/react/I18n'
import CozyClient from 'cozy-client'
import {
  shouldEnableTracking,
  getTracker
} from 'cozy-ui/transpiled/react/helpers/tracker'

import cozyBar from 'lib/cozyBar'

import { configureReporter, setCozyUrl } from 'drive/lib/reporter'
import registerClientPlugins from 'drive/lib/registerClientPlugins'

import appMetadata from 'drive/appMetadata'
import configureStore from 'drive/store/configureStore'
import { schema } from 'drive/lib/doctypes'
import { Document } from 'cozy-doctypes'
import { hashHistory } from 'react-router'

const setupApp = memoize(() => {
  const root = document.querySelector('[role=application]')
  const data = root.dataset

  const protocol = window.location ? window.location.protocol : 'https:'
  const cozyUrl = `${protocol}//${data.cozyDomain}`

  configureReporter()
  setCozyUrl(cozyUrl)
  const client = new CozyClient({
    uri: cozyUrl,
    token: data.cozyToken,
    appMetadata,
    schema
  })

  if (!Document.cozyClient) {
    Document.registerClient(client)
  }
  const locale = data.cozyLocale
  registerClientPlugins(client)
  const polyglot = initTranslation(locale, lang =>
    require(`drive/locales/${lang}`)
  )
  let history = hashHistory

  const store = configureStore({
    client,
    t: polyglot.t.bind(polyglot),
    history
  })

  cozy.client.init({
    cozyURL: cozyUrl,
    token: data.cozyToken
  })

  cozyBar.init({
    appName: data.cozyAppName,
    appEditor: data.cozyAppEditor,
    cozyClient: client,
    iconPath: data.cozyIconPath,
    lang: data.cozyLocale,
    replaceTitleOnMobile: false
  })

  if (shouldEnableTracking() && getTracker()) {
    let trackerInstance = getTracker()
    history = trackerInstance.connectToHistory(hashHistory)
    trackerInstance.track(hashHistory.getCurrentLocation()) // when using a hash history, the initial visit is not tracked by piwik react router
  }
  return { locale, polyglot, client, history, store, root }
})

export default setupApp
