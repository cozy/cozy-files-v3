import React, { Component } from 'react'
import { connect } from 'react-redux'
import Proptypes from 'prop-types'
import localForage from 'localforage'

import { MobileRouter } from 'cozy-authentication'
import { getUniversalLinkDomain } from 'cozy-ui/transpiled/react/AppLinker'
import { withClient } from 'cozy-client'
import PouchLink from 'cozy-pouch-link'
import { IconSprite } from 'cozy-ui/transpiled/react/'

import AppRoute from 'drive/web/modules/navigation/AppRoute'
import { setUrl } from 'drive/mobile/modules/settings/duck'
import {
  restoreCozyClientJs,
  initBar,
  getOldAdapterName,
  getAdapterPlugin,
  shouldMigrateAdapter
} from 'drive/mobile/lib/cozy-helper'
import { unlink } from './duck/index'
import { saveCredentials } from './sagas'
import { setCozyUrl } from 'drive/lib/reporter'
import { ONBOARDED_ITEM } from 'drive/mobile/modules/onboarding/OnBoarding'
import { PROTOCOL, SOFTWARE_NAME } from 'drive/mobile/lib/constants'
import appMetadata from 'drive/appMetadata'
import migrateOfflineFiles from 'drive/targets/mobile/migrations/migrationOfflineFiles'
import { MigrateAdapter } from 'drive/targets/mobile/migrations/MigrateAdapter'
import appBooted from 'drive/targets/mobile'

class DriveMobileRouter extends Component {
  state = {
    isAppBooted: false,
    shouldDisplayMigrate: false
  }
  async componentDidMount() {
    //Wait for the app to be booted to avoid race condition between cordova & JS
    await appBooted
    const shouldMigrate = await shouldMigrateAdapter()
    this.setState({
      isAppBooted: true,
      shouldDisplayMigrate: shouldMigrate
    })
  }

  initClientAndBar = async client => {
    const { saveServerUrl, saveCredentials } = this.props
    const accesstoken = client.getStackClient().token
    restoreCozyClientJs(
      client.getStackClient().uri,
      client.getStackClient().oauthOptions,
      client.getStackClient().token
    )
    saveCredentials(client.getStackClient().oauthOptions, accesstoken)
    saveServerUrl(client.getStackClient().uri)
    await initBar(client)
    setCozyUrl(client.getStackClient().uri)
  }

  afterAuthentication = async () => {
    const { client } = this.props

    await this.initClientAndBar(client)
    const oauthClient = client.getStackClient()
    oauthClient.onTokenRefresh = async () => {
      await this.initClientAndBar(client)
    }

    // needed to support android 11
    // added in cozy-drive v1.35.0
    await migrateOfflineFiles(client)

    //Check if we have something in the localStorage to see if
    //we need to redirect to /onboarding
    const alreadyOnboarded = await localForage.getItem(ONBOARDED_ITEM)
    //Do not try to add an else case since we can arrive from an universal
    //link and then, we need to redirect to a specific url
    if (!alreadyOnboarded) {
      this.props.history.replace('/onboarding')
    }
  }

  afterLogout = () => {
    this.props.unlink(this.props.client)
    this.props.history.replace('/')
  }

  shouldMigrateAdapter = async shouldMigrate => {
    this.setState({ shouldDisplayMigrate: false })
    if (shouldMigrate) {
      const { client } = this.props
      const pouchLink = client.links.find(link => {
        return link instanceof PouchLink
      })
      const creds = await localForage.getItem('credentials')
      const url = creds.uri
      const oldAdapter = getOldAdapterName()
      const oldAdapterPlugin = getAdapterPlugin(oldAdapter)
      const newAdapterPlugin = getAdapterPlugin('indexeddb')
      const plugins = [oldAdapterPlugin, newAdapterPlugin]
      await pouchLink.migrateAdapter({
        from: oldAdapter,
        to: 'indexeddb',
        url,
        plugins
      })
    }
  }

  render() {
    const { isAppBooted, shouldDisplayMigrate } = this.state
    if (!isAppBooted) return null
    const { history } = this.props
    return shouldDisplayMigrate ? (
      <MigrateAdapter shouldMigrateAdapter={this.shouldMigrateAdapter} />
    ) : (
      <div style={{ flex: '1' }}>
        <MobileRouter
          protocol={PROTOCOL}
          appTitle={SOFTWARE_NAME}
          universalLinkDomain={getUniversalLinkDomain()}
          appSlug={appMetadata.slug}
          history={history}
          onAuthenticated={() => {
            this.afterAuthentication()
          }}
          loginPath={false}
          onLogout={this.afterLogout}
          appIcon={require('../../../../../src/drive/targets/vendor/assets/apple-touch-icon-180x180.png')}
        >
          {AppRoute}
        </MobileRouter>
        <IconSprite />
      </div>
    )
  }
}
DriveMobileRouter.propTypes = {
  history: Proptypes.object.isRequired
}

const mapDispatchToProps = dispatch => ({
  saveServerUrl: url => dispatch(setUrl(url)),
  saveCredentials: (clientInfo, token) =>
    dispatch(saveCredentials(clientInfo, token)),
  unlink: client => dispatch(unlink(client))
})

export default connect(
  null,
  mapDispatchToProps
)(withClient(DriveMobileRouter))
