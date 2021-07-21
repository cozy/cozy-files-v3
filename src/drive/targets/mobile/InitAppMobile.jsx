/* global __DEVELOPMENT__, cordova */

import 'whatwg-fetch'

import React from 'react'
import { render } from 'react-dom'
import { hashHistory } from 'react-router'
import localforage from 'localforage'

import { isIOSApp } from 'cozy-device-helper'
import { Document } from 'cozy-doctypes'
import { initTranslation } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'

import { saveState, loadState } from 'drive/store/persistedState'
import configureStore from 'drive/store/configureStore'
import logger from 'lib/logger'
import { startBackgroundService } from 'drive/mobile/lib/background'
import { configureReporter, logException } from 'drive/lib/reporter'
import {
  startTracker,
  useHistoryForTracker,
  startHeartBeat,
  stopHeartBeat
} from 'drive/mobile/lib/tracker'
import { getLang, initClient } from 'drive/mobile/lib/cozy-helper'
import registerClientPlugins from 'drive/lib/registerClientPlugins'
import DriveMobileRouter from 'drive/mobile/modules/authorization/DriveMobileRouter'
import { backupImages } from 'drive/mobile/modules/mediaBackup/duck'
import {
  getClientSettings,
  getToken
} from 'drive/mobile/modules/authorization/duck'
import { getServerUrl, isAnalyticsOn } from 'drive/mobile/modules/settings/duck'
import { ONBOARDED_ITEM } from 'drive/mobile/modules/onboarding/OnBoarding'

import App from 'components/App/App'
// Allows to know if the launch of the application has been done by the service background
// @see: https://git.io/vSQBC
const isBackgroundServiceParameter = () => {
  const queryDict = location.search
    .substr(1)
    .split('&')
    .reduce((acc, item) => {
      const [prop, val] = item.split('=')
      return { ...acc, [prop]: val }
    }, {})

  return queryDict.backgroundservice
}

class InitAppMobile {
  initialize = () => {
    this.appReady = new Promise((resolve, reject) => {
      this.resolvePromise = resolve
      this.rejectPromise = reject
    })
    this.bindEvents()
    this.stardedApp = false
    this.isStarting = false
    if (__DEVELOPMENT__ && typeof cordova === 'undefined') this.onDeviceReady()
    return this.appReady
  }

  bindEvents = () => {
    document.addEventListener(
      'deviceready',
      () => {
        this.onDeviceReady()
        document.addEventListener('resume', this.onResume.bind(this), false)
        document.addEventListener('pause', this.onPause.bind(this), false)
      },
      false
    )

    /*We add fastclick only for iOS since Chrome removed this behavior (iOS also, but
      we still use UIWebview and not WKWebview... )*/
    if (isIOSApp()) {
      var FastClick = require('fastclick')
      document.addEventListener(
        'DOMContentLoaded',
        function() {
          FastClick.attach(document.body)
        },
        false
      )
    }
  }

  getCozyURL = async () => {
    if (this.cozyURL) return this.cozyURL
    const persistedState = (await this.getPersistedState()) || {}
    // TODO: not ideal to access the server URL in the persisted state like this...
    this.cozyURL = persistedState.mobile
      ? persistedState.mobile.settings.serverUrl
      : ''
    return this.cozyURL
  }

  getPersistedState = async () => {
    if (this.persistedState) return this.persistedState
    this.persistedState = await loadState()
    return this.persistedState
  }

  getClient = async () => {
    if (this.client) return this.client
    const cozyURL = await this.getCozyURL()
    this.client = await initClient(cozyURL)

    if (!Document.cozyClient) {
      Document.registerClient(this.client)
    }
    return this.client
  }

  getPolyglot = () => {
    if (!this.polyglot) {
      this.polyglot = initTranslation(getLang(), lang =>
        require(`drive/locales/${lang}`)
      )
    }
    return this.polyglot
  }

  getStore = async () => {
    if (this.store) return this.store
    const client = this.client || (await this.getClient())
    const polyglot = this.getPolyglot()
    const persistedState = await this.getPersistedState()
    this.store = configureStore({
      client,
      t: polyglot.t.bind(polyglot),
      initialState: persistedState,
      history: hashHistory
    })
    return this.store
  }

  onDeviceReady = async () => {
    if (this.isStarting === true) {
      return
    }

    try {
      this.isStarting = true
      const store = await this.getStore()
      this.startApplication()
      await this.appReady
      this.getPolyglot()
      this.openWith()
      if (isBackgroundServiceParameter()) {
        startBackgroundService()
      }
      store.dispatch(backupImages())
      if (navigator && navigator.splashscreen) navigator.splashscreen.hide()
    } catch (e) {
      logger.error(`onDeviceReady catches : ${e}`)
    }
  }

  onResume = async () => {
    const store = await this.getStore()
    store.dispatch(backupImages())
    if (isAnalyticsOn(store.getState())) startHeartBeat()
  }
  /**
   * onPause is called when the app goes to background.
   * So it's also called when we kill an application since
   * we've to put the app in background (multi-task for instance)
   * to kill it
   */
  onPause = async () => {
    const store = await this.getStore()
    if (isAnalyticsOn(store.getState())) stopHeartBeat()
    // TODO: selector
    // We don't want to send the notification for now
    /* if (store.getState().mobile.mediaBackup.currentUpload && isIOSApp()) {
      const t = getTranslateFunction()
      scheduleNotification({
        text: t('mobile.notifications.backup_paused')
      })
    } */
    const currentState = store.getState()
    saveState({
      mobile: {
        authorization: currentState.mobile.authorization,
        settings: currentState.mobile.settings,
        mediaBackup: {
          uploaded: currentState.mobile.mediaBackup.uploaded
        }
      },
      availableOffline: currentState.availableOffline
    })
  }

  /**
   * openWith is called when the app is launched by the OS
   * when the user shares something to Cozy-Drive
   */
  openWith = () => {
    function initSuccess() {
      console.log('openWith init success!') // eslint-disable-line no-console
    }
    function initError(err) {
      logException(`openWith init failed: ${err}`)
    }

    cordova.openwith && cordova.openwith.init(initSuccess, initError)
    cordova.openwith && cordova.openwith.addHandler(this.openWithHandler)
  }

  /**
   * We write the items in localStorage and then push to a specific route
   */
  openWithHandler = async intent => {
    //We prefer to remove previous imported items if no
    //imported in order to create a new fresh import
    try {
      await localforage.removeItem('importedFiles')
    } catch (e) {
      logger.error(`openWithHandler can't remove item: ${e}`)
      return Alerter.error('ImportToDrive.error')
    }
    if (intent.items && intent.items.length > 0) {
      try {
        await localforage.setItem('importedFiles', intent.items)
        hashHistory.push('/uploadfrommobile')
      } catch (error) {
        logger.error(`openWithHandler can't set item: ${error}`)
        Alerter.error('ImportToDrive.error')
      }
    }
  }

  migrateToCozyAuth = async () => {
    const store = await this.getStore()
    const oauthOptions = getClientSettings(store.getState())
    const token = getToken(store.getState())
    const uri = await this.getCozyURL()
    const alreadyMigrated = await localforage.getItem('credentials')

    if (uri && oauthOptions && token && !alreadyMigrated) {
      await localforage.setItem(ONBOARDED_ITEM, true)
      return await localforage.setItem('credentials', {
        uri,
        oauthOptions,
        token
      })
    }
    return
  }

  startApplication = async () => {
    if (this.stardedApp) return

    const client = await this.getClient()
    const store = await this.getStore()

    registerClientPlugins(client)
    const polyglot = await this.getPolyglot()
    //needed to migrate from cozy-drive auth to cozy-authenticate.
    //@TODO should be remove one day. It has been added for the migration
    //from 1.18.17 to 1.18.18
    await this.migrateToCozyAuth()

    if (!__DEVELOPMENT__) configureReporter()

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHistoryForTracker(hashHistory)

    if (isAnalyticsOn(store.getState())) {
      startTracker(getServerUrl(store.getState()))
    }

    const root = document.querySelector('[role=application]')

    render(
      <App lang={getLang()} polyglot={polyglot} client={client} store={store}>
        <DriveMobileRouter history={hashHistory} />
      </App>,
      root,
      () => {
        this.stardedApp = true
        this.isStarting = false
        this.resolvePromise(true)
      }
    )
  }
}

export default InitAppMobile
