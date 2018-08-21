import { startReplication as startPouchReplication } from '../lib/replication'
import { openFolder, getOpenedFolderId } from '../../actions'
import { startTracker, stopTracker } from '../lib/tracker'
import { revokeClient as reduxRevokeClient } from './authorization'
import { resetClient } from '../lib/cozy-helper'
import {
  getServerUrl,
  isFirstReplicationDone,
  getPouchIndexes
} from '../reducers/settings'

export const SET_URL = 'SET_URL'
export const BACKUP_IMAGES = 'BACKUP_IMAGES'
export const BACKUP_CONTACTS = 'BACKUP_CONTACTS'
export const WIFI_ONLY = 'WIFI_ONLY'
// export const ERROR = 'ERROR'
export const SET_ANALYTICS = 'SET_ANALYTICS'
export const SET_TOKEN = 'SET_TOKEN'

export const SET_CLIENT = 'SET_CLIENT'
export const SET_OFFLINE = 'SET_OFFLINE'
export const SET_FIRST_REPLICATION = 'SET_FIRST_REPLICATION'
export const SET_POUCH_INDEXES = 'SET_POUCH_INDEXES'

export const setClient = client => ({ type: SET_CLIENT, client })

export const setOffline = offline => ({ type: SET_OFFLINE, offline })

export const setFirstReplication = firstReplication => ({
  type: SET_FIRST_REPLICATION,
  firstReplication
})

export const setPouchIndexes = indexes => ({
  type: SET_POUCH_INDEXES,
  indexes
})

export const setUrl = url => ({ type: SET_URL, url })

export const setAnalytics = (analytics, source = 'settings') => (
  dispatch,
  getState
) => {
  dispatch({ type: SET_ANALYTICS, analytics })
  const serverUrl = getServerUrl(getState())
  if (analytics && serverUrl) {
    startTracker(serverUrl)
  } else if (analytics === false) {
    stopTracker()
  }
}

export const setBackupImages = backupImages => ({
  type: BACKUP_IMAGES,
  backupImages
})

export const setWifiOnly = wifiOnly => ({ type: WIFI_ONLY, wifiOnly })

export const setToken = token => ({ type: SET_TOKEN, token })

export const saveCredentials = (client, token) => (dispatch, getState) => {
  dispatch(setClient(client))
  dispatch(setToken(token))
  startReplication(dispatch, getState)
}

export const startReplication = (dispatch, getState) => {
  const firstReplication = isFirstReplicationDone(getState())
  const existingIndexes = getPouchIndexes(getState())
  const refreshFolder = () => {
    dispatch(openFolder(getOpenedFolderId(getState())))
  }
  const revokeClient = () => {
    resetClient()
    dispatch(reduxRevokeClient())
  }
  const firstReplicationFinished = () => {
    dispatch(setFirstReplication(true))
  }
  const indexesCreated = indexes => {
    dispatch(setPouchIndexes(indexes))
  }

  startPouchReplication(
    existingIndexes,
    firstReplication,
    firstReplicationFinished,
    refreshFolder,
    revokeClient,
    indexesCreated
  )
}
