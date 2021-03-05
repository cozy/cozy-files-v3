/* global cozy */

import 'whatwg-fetch'
import React from 'react'
import { render } from 'react-dom'

import 'cozy-ui/transpiled/react/stylesheet.css'

import { Router, Route, Redirect, hashHistory } from 'react-router'
import CozyClient, { models } from 'cozy-client'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import { ThumbnailSizeContextProvider } from 'drive/lib/ThumbnailSizeContext'
import { ModalContextProvider } from 'drive/lib/ModalContext'

import { I18n, initTranslation } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import SharingProvider from 'cozy-sharing'

import { getQueryParameter } from 'react-cozy-helpers'
import registerClientPlugins from 'drive/lib/registerClientPlugins'

import { schema } from 'drive/lib/doctypes'
import configureStore from 'drive/store/configureStore'
import PublicLayout from 'drive/web/modules/public/PublicLayout'
import PublicFolderView from 'drive/web/modules/views/Public'
import LightFileViewer from 'drive/web/modules/public/LightFileViewer'
import FileHistory from 'components/FileHistory'
import ErrorShare from 'components/Error/ErrorShare'
import { configureReporter, setCozyUrl } from 'drive/lib/reporter'
import getSharedDocument from 'cozy-sharing/dist/getSharedDocument'
import appMetadata from 'drive/appMetadata'
import logger from 'lib/logger'
import cozyBar from 'lib/cozyBar'

import App from 'components/App/App'
import ExternalRedirect from 'drive/web/modules/navigation/ExternalRedirect'

const initCozyBar = (data, client) => {
  if (
    data.cozyAppName &&
    data.cozyAppEditor &&
    data.cozyIconPath &&
    data.cozyLocale
  ) {
    cozyBar.init({
      appName: data.cozyAppName,
      appEditor: data.cozyAppEditor,
      cozyClient: client,
      iconPath: data.cozyIconPath,
      lang: data.cozyLocale,
      replaceTitleOnMobile: true,
      isPublic: true
    })
  }
}

const renderError = (lang, root) =>
  render(
    <I18n lang={lang} dictRequire={lang => require(`drive/locales/${lang}`)}>
      <ErrorShare errorType={`public_unshared`} />
    </I18n>,
    root
  )

const init = async () => {
  const lang = document.documentElement.getAttribute('lang') || 'en'
  const root = document.querySelector('[role=application]')
  const dataset = root.dataset
  const { sharecode } = getQueryParameter()

  const protocol = window.location ? window.location.protocol : 'https:'
  const cozyUrl = `${protocol}//${dataset.cozyDomain}`

  const client = new CozyClient({
    uri: cozyUrl,
    token: sharecode,
    appMetadata,
    schema
  })
  registerClientPlugins(client)

  configureReporter()
  setCozyUrl(cozyUrl)
  // we still need cozy-client-js for opening a folder
  cozy.client.init({
    cozyURL: cozyUrl,
    token: sharecode
  })

  const polyglot = initTranslation(dataset.cozyLocale, lang =>
    require(`drive/locales/${lang}`)
  )

  const store = configureStore({
    client,
    t: polyglot.t.bind(polyglot),
    history: hashHistory
  })

  try {
    const sharedDocumentId = await getSharedDocument(client)

    const { data } = await client
      .collection('io.cozy.files')
      .get(sharedDocumentId)
    const isFile = data && data.type === 'file'
    const isNote = models.file.isNote(data)
    if (isNote) {
      try {
        window.location.href = await models.note.fetchURL(client, data)
      } catch (e) {
        Alerter.error('alert.offline')
      }
    } else {
      initCozyBar(dataset)
      render(
        <App lang={lang} polyglot={polyglot} client={client} store={store}>
          <SharingProvider>
            <BreakpointsProvider>
              <ThumbnailSizeContextProvider>
                <ModalContextProvider>
                  {isFile ? (
                    <PublicLayout>
                      <LightFileViewer files={[data]} isFile={true} />
                    </PublicLayout>
                  ) : (
                    <Router history={hashHistory}>
                      <Route component={PublicLayout}>
                        <Redirect
                          from="/files/:folderId"
                          to="/folder/:folderId"
                        />
                        <Route
                          path="folder(/:folderId)"
                          component={PublicFolderView}
                        >
                          <Route
                            path="file/:fileId/revision"
                            component={FileHistory}
                          />
                        </Route>
                      </Route>
                      <Route
                        path="external/:fileId"
                        component={ExternalRedirect}
                      />
                      <Redirect from="/*" to={`folder/${sharedDocumentId}`} />
                    </Router>
                  )}
                </ModalContextProvider>
              </ThumbnailSizeContextProvider>
            </BreakpointsProvider>
          </SharingProvider>
        </App>,
        root
      )
    }
  } catch (e) {
    logger.warn(e)
    initCozyBar(dataset, client)
    renderError(lang, root)
  }
}

document.addEventListener('DOMContentLoaded', init)
