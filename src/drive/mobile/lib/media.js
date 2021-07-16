import { getToken, getClientUrl } from './cozy-helper'
import { logException } from 'drive/lib/reporter'
import { isMobileApp } from 'cozy-device-helper'
import logger from 'lib/logger'
import { version } from '../../../../package.json'
const hasCordovaPlugin = () => {
  return (
    isMobileApp() &&
    window.cordova.plugins !== undefined &&
    window.cordova.plugins.listLibraryItems !== undefined
  )
}

export const isAuthorized = async () => {
  if (!hasCordovaPlugin()) {
    return Promise.resolve(false)
  }
  return new Promise(resolve => {
    const success = () => resolve(true)
    const error = () => resolve(false)
    window.cordova.plugins.listLibraryItems.isAuthorized(success, error)
  })
}

export const requestAuthorization = async () => {
  if (!hasCordovaPlugin()) {
    return Promise.resolve(false)
  }
  return new Promise(resolve => {
    window.cordova.plugins.listLibraryItems.requestReadAuthorization(
      () => resolve(true),
      error => {
        if (!error.startsWith('Permission')) {
          logException('requestAuthorization error:', error)
        }
        resolve(false)
      }
    )
  })
}
/**
 * Generates an http payload for the native part.
 * The uri and file variables are from the native part,
 * used to return a payload with headers.
 * @param {any} file - The file to upload, used to get the id, mimeType, and filePath.
 * @param {any} uri - The uri, used to get the serverUrl.
 */
const generatePayloadForNative = async ({
  uri,
  file,
  method = 'POST',
  id = undefined
}) => {
  const token = await getToken()
  const payload = {
    id,
    serverUrl: uri,
    libraryId: file['id'],
    mimeType: file['mimeType'],
    filePath: file['filePath'],
    createdDate: file['creationDate'],
    httpMethod: method,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': file['mimeType'],
      'User-Agent': `io.cozy.drive.mobile-${version}`
    }
  }
  return payload
}

const uploadNativeItem = (payload, progressCallback, thumbnailCallback) => {
  return new Promise((resolve, reject) => {
    window.cordova.plugins.listLibraryItems.uploadItem(
      payload,
      result => {
        if (result.errors) reject(result.errors)
        else if (result.progress !== undefined)
          progressCallback(result.progress)
        else if (result.thumbnail) thumbnailCallback(result.thumbnail)
        else {
          resolve(result)
        }
      },
      reject
    )
  })
}
export const updateLibraryItem = async (
  previousDocument,
  libraryItem,
  progressCallback,
  thumbnailCallback
) => {
  if (hasCordovaPlugin()) {
    // the cordova plugin is going to do the upload and needs all the infos to make a request to the stack
    const uri =
      getClientUrl() + '/files/' + encodeURIComponent(previousDocument._id)
    const payload = await generatePayloadForNative({
      uri,
      file: libraryItem,
      method: 'PUT'
    })
    return uploadNativeItem(payload, progressCallback, thumbnailCallback)
  }
  return Promise.resolve()
}
export const uploadLibraryItem = async (
  dirID,
  libraryItem,
  progressCallback,
  thumbnailCallback
) => {
  if (hasCordovaPlugin()) {
    const uri =
      getClientUrl() +
      '/files/' +
      encodeURIComponent(dirID) +
      '?Name=' +
      encodeURIComponent(libraryItem['fileName']) +
      '&Type=file&Tags=library&Executable=false'
    const payload = await generatePayloadForNative({
      id: dirID,
      file: libraryItem,
      uri
    })
    return uploadNativeItem(payload, progressCallback, thumbnailCallback)
  }

  return Promise.resolve()
}

export const getPhotos = async () => {
  const defaultReturn = []

  if (hasCordovaPlugin()) {
    return new Promise(resolve => {
      window.cordova.plugins.listLibraryItems.listItems(
        true,
        true,
        false, // includePictures, includeVideos, includeCloud
        response => resolve(response.library),
        err => {
          logger.warn(err)
          resolve(defaultReturn)
        }
      )
    })
  }

  return Promise.resolve(defaultReturn)
}
