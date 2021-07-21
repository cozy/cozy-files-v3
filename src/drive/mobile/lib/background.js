/* eslint no-console: 0 */
import configureStore from 'drive/store/configureStore'
import { loadState } from 'drive/store/persistedState'
import { startMediaBackup } from 'drive/mobile/modules/mediaBackup/duck'
import { initClient } from './cozy-helper'
import { logException, configureReporter } from 'drive/lib/reporter'
import logger from 'lib/logger'

import { getTranslateFunction } from './i18n'

import {
  getPlatform,
  isMobileApp,
  isIOSApp,
  isAndroidApp
} from 'cozy-device-helper'

/*
  This files is split on 4 parts:
    - GENERIC: Platform agnostic
    - SERVICE: The service background
    - ANDROID: The Android-specific part
    - IOS: The iOS-specific part

  Only 3 functions are export:
    - updateStatusBackgroundService: to enbale/disable background service
    - startBackgroundService: to start background service
    - disableBackgroundService: to disable background service

  For each platform (Android, iOS) we have:
    - has__platform__CordovaPlugin: Checks if the plugin is installed
    - enable__platform__BackgroundService and disable__platform__BackgroundService
    - start__platform__BackgroundService: Allowing to add a specific callback at the end of the service
*/

// GENERIC

export const updateStatusBackgroundService = backupImages => {
  if (backupImages) {
    enableBackgroundService()
  } else {
    disableBackgroundService()
  }
}

export const startBackgroundService = () => {
  if (hasIosCordovaPlugin()) {
    startIosBackgroundService()
  } else if (hasAndroidCordovaPlugin()) {
    startAndroidBackgroundService()
  } else {
    notCompatibleError()
  }
}

const enableBackgroundService = () => {
  if (hasIosCordovaPlugin()) {
    enableIosBackgroundService()
  } else if (hasAndroidCordovaPlugin()) {
    enableAndroidBackgroundService()
  } else {
    notCompatibleError()
  }
}

export const disableBackgroundService = async () => {
  if (hasIosCordovaPlugin()) {
    disableIosBackgroundService()
  } else if (hasAndroidCordovaPlugin()) {
    await disableAndroidBackgroundService()
  } else {
    notCompatibleError()
  }
}

const notCompatibleError = () => {
  const msg = 'Background Service is not compatible with your platform.'
  logger.warn(msg)
  if (isMobileApp()) {
    logger.log(getPlatform())
    if (isIOSApp()) {
      logger.log(window.BackgroundFetch)
    } else if (isAndroidApp()) {
      logger.log(window.JSBackgroundService)
    }
  }
  logException(msg)
}

// SERVICE

const backgroundService = async () => {
  logger.log('BackgroundFetch initiated')

  const persistedState = await loadState()
  const cozyURL = persistedState.mobile.settings.serverUrl
  configureReporter()
  const client = await initClient(cozyURL)
  const store = configureStore({
    client,
    t: getTranslateFunction(),
    initialState: persistedState
  })
  return store.dispatch(startMediaBackup())
}

// ANDROID

const hasAndroidCordovaPlugin = () =>
  isAndroidApp() && window.JSBackgroundService !== undefined

const enableAndroidBackgroundService = async () => {
  const isEnable = await isEnableAndroidBackgroundService()
  if (!isEnable) {
    const repeatingPeriod = 60 * 60 * 1000
    window.JSBackgroundService.setRepeating(repeatingPeriod, err => {
      if (err) {
        logger.warn(err)
        logException('enableAndroidBackgroundService error')
      }
    })
  }
}

const disableAndroidBackgroundService = async () => {
  const isEnable = await isEnableAndroidBackgroundService()
  if (isEnable) {
    window.JSBackgroundService.cancelRepeating(err => {
      if (err) {
        logger.warn(err)
        logException('disableAndroidBackgroundService error')
      }
    })
  }
}

const startAndroidBackgroundService = () => {
  backgroundService().then(() => {
    stopAndroidBackgroundService()
  })
}

const stopAndroidBackgroundService = () => {
  window.service.workDone()
}

const isEnableAndroidBackgroundService = () =>
  new Promise(resolve => {
    window.JSBackgroundService.isRepeating((err, isSet) => {
      if (err) {
        logger.warn(err)
        logException('isEnableAndroidBackgroundService error')
        resolve(false)
      }
      resolve(isSet)
    })
  })

// IOS

const hasIosCordovaPlugin = () =>
  isIOSApp() && window.BackgroundFetch !== undefined

const enableIosBackgroundService = () => {
  // documentation: https://github.com/transistorsoft/cordova-plugin-background-fetch
  const fetcher = window.BackgroundFetch

  const failureCallback = error => {
    logger.log('BackgroundFetch failed', error)
  }

  const options = {
    stopOnTerminate: false
  }
  fetcher.configure(startIosBackgroundService, failureCallback, options)
}

const disableIosBackgroundService = () => {
  window.BackgroundFetch.stop()
}

const startIosBackgroundService = () => {
  backgroundService().then(() => {
    stopIosBackgroundService()
  })
}

const stopIosBackgroundService = () => {
  window.BackgroundFetch.finish()
}
