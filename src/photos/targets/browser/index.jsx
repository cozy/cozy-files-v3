/* global cozy __DEVELOPMENT__ */

import 'cozy-ui/transpiled/react/stylesheet.css'

import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { compose, createStore, combineReducers, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import { Router, hashHistory } from 'react-router'

import CozyClient, { CozyProvider } from 'cozy-client'
import { RealtimePlugin } from 'cozy-realtime'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { I18n } from 'cozy-ui/transpiled/react/I18n'
import SharingProvider from 'cozy-sharing'

import { DOCTYPE_ALBUMS } from 'drive/lib/doctypes'

import appReducers from 'photos/reducers'
import AppRoute from 'photos/components/AppRoute'
import StyledApp from 'photos/components/StyledApp'
import {
  shouldEnableTracking,
  getTracker,
  createTrackerMiddleware
} from 'cozy-ui/transpiled/react/helpers/tracker'
import memoize from 'lodash/memoize'

import { configureReporter, setCozyUrl } from 'drive/lib/reporter'
import appMetadata from 'photos/appMetadata'
import doctypes from './doctypes'
const loggerMiddleware = createLogger()

const setupAppContext = memoize(() => {
  const root = document.querySelector('[role=application]')
  const data = JSON.parse(root.dataset.cozy)
  const lang = document.documentElement.getAttribute('lang') || 'en'
  const protocol = window.location ? window.location.protocol : 'https:'
  const cozyUrl = `${protocol}//${data.domain}`
  const client = new CozyClient({
    uri: cozyUrl,
    token: data.token,
    appMetadata,
    schema: doctypes,
    store: false
  })
  client.registerPlugin(RealtimePlugin)

  configureReporter()
  setCozyUrl(cozyUrl)
  let history = hashHistory
  let middlewares = [thunkMiddleware, loggerMiddleware]

  if (shouldEnableTracking() && getTracker()) {
    let trackerInstance = getTracker()
    history = trackerInstance.connectToHistory(hashHistory)
    trackerInstance.track(hashHistory.getCurrentLocation()) // when using a hash history, the initial visit is not tracked by piwik react router
    middlewares.push(createTrackerMiddleware())
  }

  // Enable Redux dev tools
  const composeEnhancers =
    (__DEVELOPMENT__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

  const store = createStore(
    combineReducers({ ...appReducers, cozy: client.reducer() }),
    composeEnhancers(applyMiddleware.apply(this, middlewares))
  )
  client.setStore(store)
  const locale = data.locale
  cozy.bar.init({
    appName: data.app.name,
    appEditor: data.app.editor,
    cozyClient: client,
    iconPath: data.app.icon,
    lang: lang,
    replaceTitleOnMobile: true,
    appSlug: data.app.slug,
    appNamePrefix: data.app.prefix
  })
  return { store, locale, client, history, root }
})

const App = props => {
  return (
    <Provider store={props.store}>
      <I18n
        lang={props.locale}
        dictRequire={lang => require(`photos/locales/${lang}`)}
      >
        <CozyProvider client={props.client}>
          <BreakpointsProvider>
            <StyledApp>
              <SharingProvider doctype={DOCTYPE_ALBUMS} documentType="Albums">
                {props.children}
              </SharingProvider>
            </StyledApp>
          </BreakpointsProvider>
        </CozyProvider>
      </I18n>
    </Provider>
  )
}

const AppWithRouter = props => (
  <App {...props}>
    <Router history={props.history} routes={AppRoute} />
  </App>
)

const init = () => {
  const { store, locale, client, history, root } = setupAppContext()
  render(
    <AppWithRouter
      store={store}
      locale={locale}
      client={client}
      history={history}
    />,
    root
  )
}
document.addEventListener('DOMContentLoaded', () => {
  init()
})

if (module.hot) {
  init()
  module.hot.accept()
}
