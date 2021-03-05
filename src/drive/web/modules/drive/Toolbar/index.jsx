/* global cozy */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import cx from 'classnames'

import SharingProvider, { SharedDocument } from 'cozy-sharing'
import PropTypes from 'prop-types'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'

import BarContextProvider from 'cozy-ui/transpiled/react/BarContextProvider'
import { withClient } from 'cozy-client'
import cozyBar from 'lib/cozyBar'

import { isSelectionBarVisible } from 'drive/web/modules/selection/duck'

import styles from 'drive/styles/toolbar.styl'
import { getCurrentFolderId } from 'drive/web/modules/selectors'
import InsideRegularFolder from 'drive/web/modules/drive/Toolbar/components/InsideRegularFolder'

import UploadButtonItem from './components/UploadButtonItem'
import MoreMenu from './components/MoreMenu'

import ShareButton from './share/ShareButton'
import SharedRecipients from './share/SharedRecipients'

class Toolbar extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  static defaultProps = {
    canUpload: false,
    canCreateFolder: false,
    hasWriteAccess: false
  }

  shouldComponentUpdate(nextProps) {
    if (
      nextProps.disabled !== this.props.disabled ||
      nextProps.selectionModeActive !== this.props.selectionModeActive ||
      nextProps.canUpload !== this.props.canUpload ||
      nextProps.canCreateFolder !== this.props.canCreateFolder ||
      nextProps.hasWriteAccess !== this.props.hasWriteAccess ||
      nextProps.isShared !== this.props.isShared ||
      nextProps.breakpoints.isMobile !== this.props.breakpoints.isMobile
    ) {
      return true
    }
    return false
  }

  render() {
    const {
      t,
      lang,
      disabled,
      selectionModeActive,
      canUpload,
      canCreateFolder,
      hasWriteAccess,
      isShared,
      breakpoints: { isMobile },
      client
    } = this.props

    const isDisabled = disabled || selectionModeActive
    if (disabled) {
      return null
    }
    const { BarRight } = cozyBar

    return (
      <div
        data-test-id="fil-toolbar-files"
        className={cx(styles['fil-toolbar-files'], 'u-flex-items-center')}
        role="toolbar"
      >
        {!isShared &&
          canUpload &&
          hasWriteAccess && <UploadButtonItem disabled={isDisabled} />}
        <InsideRegularFolder>
          <SharedRecipients />
        </InsideRegularFolder>
        <InsideRegularFolder>
          <ShareButton isDisabled={isDisabled} />
        </InsideRegularFolder>

        {isMobile ? (
          <BarRight>
            <BarContextProvider
              client={client}
              store={this.context.store}
              t={t}
              lang={lang}
            >
              <SharingProvider doctype="io.cozy.files" documentType="Files">
                <MoreMenu
                  isDisabled={isDisabled}
                  canCreateFolder={canCreateFolder}
                  canUpload={canUpload}
                  hasWriteAccess={hasWriteAccess}
                />
              </SharingProvider>
            </BarContextProvider>
          </BarRight>
        ) : (
          <MoreMenu
            isDisabled={isDisabled}
            canCreateFolder={canCreateFolder}
            canUpload={canUpload}
            hasWriteAccess={hasWriteAccess}
          />
        )}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  folderId: getCurrentFolderId(state),
  selectionModeActive: isSelectionBarVisible(state)
})

/**
 * Provides the Toolbar with sharing properties of the current folder.
 *
 * In views where the displayed folder is virtual (eg: Recent files, Sharings),
 * no sharing information is provided to the Toolbar.
 */
const ToolbarWithSharingContext = props => {
  return !props.folderId ? (
    <Toolbar {...props} />
  ) : (
    <SharedDocument docId={props.folderId}>
      {sharingProps => {
        const { isShared, hasWriteAccess } = sharingProps
        return (
          <Toolbar
            {...props}
            hasWriteAccess={hasWriteAccess}
            isShared={isShared}
          />
        )
      }}
    </SharedDocument>
  )
}

ToolbarWithSharingContext.displayName = 'ToolbarWithSharingContext'

export default compose(
  translate(),
  withClient,
  connect(
    mapStateToProps,
    null
  ),
  withBreakpoints()
)(ToolbarWithSharingContext)
