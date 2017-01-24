/* eslint-env jest */

import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import {
  FETCH_PHOTOS,
  RECEIVE_PHOTOS,
  FETCH_PHOTOS_FAILURE,
  UPLOAD_PHOTOS,
  UPLOAD_PHOTOS_SUCCESS,
  UPLOAD_PHOTOS_SUCCESS_WITH_CONFLICTS,
  UPLOAD_PHOTOS_FAILURE
} from '../../src/constants/actionTypes'
import {
  fetchPhotos,
  uploadPhotos,
  extractFileAttributes
} from '../../src/actions/photos'

import cozy from 'cozy-client-js'

const mockFetchedPhotos = [
  {
    _id: '33dda00f0eec15bc3b3c59a615001ac8',
    created_at: '0001-01-01T00:00:00Z',
    name: 'MonImage.jpg',
    size: '150000',
    updated_at: '0001-01-01T00:00:00Z'
  }
]

const mockUploadedPhoto = {
  _type: 'io.cozy.files',
  _id: 'f717eb4d94f07737b168d3dbb7002141',
  attributes: {
    type: 'file',
    name: 'MonImage.jpg',
    dir_id: 'io.cozy.files.root-dir',
    created_at: '0001-01-01T00:00:00Z',
    updated_at: '0001-01-01T00:00:00Z',
    size: '150000',
    md5sum: 'wul1lk+i94dp3H5Dq+O54w==',
    mime: 'image/jpeg',
    class: 'image',
    executable: false,
    tags: []
  },
  _rev: '1-f796f37c53b0e3925b7104fab3935265',
  relations: () => undefined
}

const mockErrorsResponses = {
  conflict: {
    status: 409,
    reason: {
      errors: [
        {
          status: 409,
          title: 'Conflict',
          detail: 'open /data/cozy-storage/cozy.test/MonImage00.jpg: file exists',
          source: {}
        }
      ]
    },
    url:
      'http://cozy.test/files/io.cozy.files.root-dir?Name=MonImage00.jpg&Type=file',
    response: {}
  },
  serverError: {
    status: 500,
    reason: {
      errors: [
        {
          status: 500,
          title: 'Server error',
          detail: 'server error',
          source: {}
        }
      ]
    },
    url:
      'http://cozy.test/files/io.cozy.files.root-dir?Name=MonImage.jpg&Type=file',
    response: {}
  }
}

jest.mock('cozy-client-js', () => {
  return {
    // default query return success fetched photos
    query: jest.fn(() => {
      return new Promise(function (resolve, reject) {
        resolve(mockFetchedPhotos)
      })
    })
    // first call return success uploaded photo
    .mockImplementationOnce(() => {
      return new Promise(function (resolve, reject) {
        resolve(mockFetchedPhotos)
      })
    })
    // second call return error when photos fetching failure
    .mockImplementationOnce(() => {
      return new Promise(function (resolve, reject) {
        reject(mockErrorsResponses.serverError)
      })
    }),
    files: {
      // default mock return success uploaded photo
      create: jest.fn(() => {
        return new Promise(function (resolve, reject) {
          resolve(mockUploadedPhoto)
        })
      })
      // first call return success uploaded photo
      .mockImplementationOnce(() => {
        return new Promise(function (resolve, reject) {
          resolve(mockUploadedPhoto)
        })
      })
      // second call return failed uploaded photo
      .mockImplementationOnce(() => {
        return new Promise(function (resolve, reject) {
          reject(mockErrorsResponses.conflict)
        })
      })
      // third call return failed uploaded photo
      .mockImplementationOnce(() => {
        return new Promise(function (resolve, reject) {
          reject(mockErrorsResponses.serverError)
        })
      })
      // fourth call return a simulated not expected error by throwing a custom
      // error which is not expected by the uploadPhotos function
      .mockImplementationOnce(() => {
        throw new Error('ERROR')
      })
    }
  }
})

const middlewares = [ thunk ]
const mockStore = configureMockStore(middlewares)

const mangoIndexByDateObject = {
  doctype: 'io.cozy.files',
  type: 'mango',
  name: '_design/54d3474c4efdfe10d790425525e56433857955a1',
  fields: ['class', 'created_at']
}

describe('fetchPhotos', () => {
  beforeEach(() => {
    cozy.query.mockClear()
  })

  it('should call cozy.query to fetch 1 photo with success', () => {
    const expectedActions = [
      {
        type: FETCH_PHOTOS,
        mangoIndexByDate: mangoIndexByDateObject
      },
      {
        type: RECEIVE_PHOTOS,
        photos: mockFetchedPhotos
      }
    ]
    const store = mockStore({})
    return store.dispatch(fetchPhotos(mangoIndexByDateObject))
      .then(() => {
        expect(cozy.query.mock.calls.length).toBe(1)
        expect(cozy.query.mock.calls[0][0]).toBe(mangoIndexByDateObject)
        expect(store.getActions()).toEqual(expectedActions)
      })
  })

  it('should call cozy.query and dispatch FETCH_PHOTOS_FAILURE if error', () => {
    const expectedActions = [
      {
        type: FETCH_PHOTOS,
        mangoIndexByDate: mangoIndexByDateObject
      },
      {
        type: FETCH_PHOTOS_FAILURE,
        error: mockErrorsResponses.serverError
      }
    ]
    const store = mockStore({})
    return store.dispatch(fetchPhotos(mangoIndexByDateObject))
      .then(() => {
        expect(cozy.query.mock.calls.length).toBe(1)
        expect(cozy.query.mock.calls[0][0]).toBe(mangoIndexByDateObject)
        expect(store.getActions()).toEqual(expectedActions)
      })
  })
})

describe('uploadPhotos', () => {
  beforeEach(() => {
    cozy.files.create.mockClear()
  })

  it('should call cozy.files.create and 1 photo uploaded with success', () => {
    const mockImagesArrayToUpload = [
      'MonImage.jpeg' // use string as image file here for testing
    ]

    const expectedActions = [
      {
        type: UPLOAD_PHOTOS
      },
      {
        type: UPLOAD_PHOTOS_SUCCESS,
        photos: [extractFileAttributes(mockUploadedPhoto)]
      }
    ]
    const store = mockStore({})
    return store.dispatch(uploadPhotos(mockImagesArrayToUpload))
      .then(() => {
        expect(cozy.files.create.mock.calls.length).toBe(1)
        expect(cozy.files.create.mock.calls[0][0]).toBe(
          mockImagesArrayToUpload[0])
        expect(store.getActions()).toEqual(expectedActions)
      })
  })

  it('should call cozy.files.create and dispatch UPLOAD_PHOTOS_SUCCESS_WITH_CONFLICTS if conflicts', () => {
    const mockImagesArrayToUpload = [
      'MonImage00.jpeg' // use string as image file here for testing
    ]

    const expectedActions = [
      {
        type: UPLOAD_PHOTOS
      },
      {
        type: UPLOAD_PHOTOS_SUCCESS_WITH_CONFLICTS,
        photos: []
      }
    ]
    const store = mockStore({})
    return store.dispatch(uploadPhotos(mockImagesArrayToUpload))
      .then(() => {
        expect(cozy.files.create.mock.calls.length).toBe(1)
        expect(cozy.files.create.mock.calls[0][0]).toBe(
          mockImagesArrayToUpload[0])
        expect(store.getActions()).toEqual(expectedActions)
      })
  })

  it('should call cozy.files.create and dispatch UPLOAD_PHOTOS_FAILURE if error', () => {
    const mockImagesArrayToUpload = [
      'MonImage.jpeg' // use string as image file here for testing
    ]

    const expectedActions = [
      {
        type: UPLOAD_PHOTOS
      },
      {
        type: UPLOAD_PHOTOS_FAILURE,
        photos: []
      }
    ]
    const store = mockStore({})
    return store.dispatch(uploadPhotos(mockImagesArrayToUpload))
      .then(() => {
        expect(cozy.files.create.mock.calls.length).toBe(1)
        expect(cozy.files.create.mock.calls[0][0]).toBe(
          mockImagesArrayToUpload[0])
        expect(store.getActions()).toEqual(expectedActions)
      })
  })

  it('should call cozy.files.create and dispatch UPLOAD_PHOTOS_FAILURE if unexpected error', () => {
    const mockImagesArrayToUpload = [
      'MonImage.jpeg' // use string as image file here for testing
    ]

    const expectedActions = [
      {
        type: UPLOAD_PHOTOS
      },
      {
        type: UPLOAD_PHOTOS_FAILURE,
        photos: []
      }
    ]
    const store = mockStore({})
    return store.dispatch(uploadPhotos(mockImagesArrayToUpload))
      .then(() => {
        expect(cozy.files.create.mock.calls.length).toBe(1)
        expect(cozy.files.create.mock.calls[0][0]).toBe(
          mockImagesArrayToUpload[0])
        expect(store.getActions()).toEqual(expectedActions)
      })
  })
})
