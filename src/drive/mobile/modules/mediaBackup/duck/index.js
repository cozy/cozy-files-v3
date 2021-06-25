import {
  getPhotos,
  isAuthorized,
  requestAuthorization
} from 'drive/mobile/lib/media'
import { isWifi } from 'drive/mobile/lib/network'
import { logException } from 'drive/lib/reporter'
import { setBackupImages } from 'drive/mobile/modules/settings/duck'
import { getUploadDir, uploadPhoto } from './files'
import {
  MEDIA_UPLOAD_START,
  MEDIA_UPLOAD_END,
  MEDIA_UPLOAD_ABORT,
  MEDIA_UPLOAD_CANCEL,
  CURRENT_UPLOAD
} from './reducer'

export const cancelMediaBackup = () => ({ type: MEDIA_UPLOAD_CANCEL })

const currentMediaUpload = (media, uploadCounter, totalUpload) => ({
  type: CURRENT_UPLOAD,
  media,
  messageData: {
    current: uploadCounter,
    total: totalUpload
  }
})

const canBackup = (isManualBackup, getState) => {
  const backupOnAnyNetworkType = !getState().mobile.settings.wifiOnly

  return (
    (isManualBackup || getState().mobile.settings.backupImages) &&
    (isWifi() || backupOnAnyNetworkType)
  )
}

export const startMediaBackup = (isManualBackup = false) => async (
  dispatch,
  getState,
  { client, t }
) => {
  dispatch({ type: MEDIA_UPLOAD_START })
  await client.getStackClient().fetchJSON('POST', '/settings/synchronized')
  if (!(await isAuthorized())) {
    const promptForPermissions = isManualBackup
    const receivedAuthorisation = await updateValueAfterRequestAuthorization(
      promptForPermissions
    )
    // manual backup is only possible if the authorization is accepted
    if (isManualBackup && !receivedAuthorisation) isManualBackup = false
    // disable backupImages when authorization is refused
    if (getState().mobile.settings.backupImages && !receivedAuthorisation) {
      await dispatch(setBackupImages(false))
    }
  }
  if (canBackup(isManualBackup, getState)) {
    try {
      const photosOnDevice = await getPhotos()
      const alreadyUploaded = getState().mobile.mediaBackup.uploaded
      const photosToUpload = photosOnDevice.filter(
        photo => !alreadyUploaded.includes(photo.id)
      )
      const totalUpload = photosToUpload.length
      if (totalUpload > 0) {
        const {
          _id: uploadDirId,
          attributes: { path: uploadDirPath }
        } = await getUploadDir(client, t)
        let uploadCounter = 0
        for (const photo of photosToUpload) {
          if (
            getState().mobile.mediaBackup.cancelMediaBackup ||
            getState().mobile.mediaBackup.diskQuotaReached ||
            !canBackup(isManualBackup, getState)
          ) {
            break
          }
          dispatch(currentMediaUpload(photo, uploadCounter++, totalUpload))
          await dispatch(uploadPhoto(uploadDirPath, uploadDirId, photo, client))
        }
      }

      await client.getStackClient().fetchJSON('POST', '/settings/synchronized')
    } catch (e) {
      dispatch({ type: MEDIA_UPLOAD_ABORT })
      if (!e.message.match(/Failed to fetch/))
        logException(`Unexpected error during the files backup (${e.message})`)
    }
  } else {
    dispatch({ type: MEDIA_UPLOAD_ABORT })
  }

  dispatch({ type: MEDIA_UPLOAD_END })
}

export const backupImages = (backupImages, force = false) => async (
  dispatch,
  getState
) => {
  // TODO: it looks like the media backup is triggered twice at app init, but I couldn't figure why :/
  // This fixes the issue, but we'll need to figure out why it is triggered twice...
  if (getState().mobile.mediaBackup.running === true && !force) {
    return
  }
  if (backupImages === undefined) {
    backupImages = getState().mobile.settings.backupImages
  } else {
    await dispatch(setBackupImages(backupImages))
  }

  const isAuthorized = await updateValueAfterRequestAuthorization(backupImages)
  if (backupImages && !isAuthorized) {
    backupImages = isAuthorized
    dispatch(setBackupImages(backupImages))
  }

  const {
    updateStatusBackgroundService
  } = require('drive/mobile/lib/background')
  updateStatusBackgroundService(backupImages)
  if (backupImages) {
    dispatch(startMediaBackup())
  }

  return backupImages
}

const updateValueAfterRequestAuthorization = async value => {
  if (value) {
    value = await requestAuthorization()
  }
  return value
}

export { default } from './reducer'
