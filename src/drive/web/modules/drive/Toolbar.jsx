/* global cozy */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { translate } from 'cozy-ui/react/I18n'
import { withBreakpoints } from 'cozy-ui/react'

import { MoreButton } from 'components/Button'
import Menu, { Item } from 'components/Menu'

import { IntentButton } from 'drive/web/modules/services/components/Intent'

import { isSelectionBarVisible } from 'drive/web/modules/selection/duck'
import { SharedDocument } from 'sharing'

import styles from 'drive/styles/toolbar'

import NotRootFolder from 'drive/web/modules/drive/Toolbar/components/NotRootFolder'

import DeleteItem from './Toolbar/components/DeleteItem'
import SelectableItem from './Toolbar/components/SelectableItem'
import AddFolderItem from './Toolbar/components/AddFolderItem'
import UploadItem from './Toolbar/components/UploadItem'
import DownloadButtonItem from './Toolbar/components/DownloadButtonItem'
import ShareItem from './Toolbar/components/ShareItem'
import ShareButton from './Toolbar/components/ShareButton'
import SharedRecipients from './Toolbar/components/SharedRecipients'
const { BarRight } = cozy.bar

class Toolbar extends Component {
  render() {
    const cozyDev = cozy.client._url === 'http://cozy.tools:8080'
    const cozyRecette = cozy.client._url === 'https://recette.cozy.works'
    const {
      t,
      disabled,
      selectionModeActive,
      canUpload,
      canCreateFolder,
      hasWriteAccess,
      isShared,
      breakpoints: { isMobile }
    } = this.props

    const isDisabled = disabled || selectionModeActive

    const MoreMenu = (
      <Menu
        title={t('toolbar.item_more')}
        disabled={isDisabled}
        className={styles['fil-toolbar-menu']}
        innerClassName={styles['fil-toolbar-inner-menu']}
        button={<MoreButton>{t('Toolbar.more')}</MoreButton>}
      >
        <NotRootFolder>
          <Item>
            <ShareItem />
          </Item>
        </NotRootFolder>
        {canUpload &&
          hasWriteAccess && (
            <Item>
              <UploadItem insideMoreMenu disabled={isDisabled} />
            </Item>
          )}
        {canCreateFolder &&
          hasWriteAccess && (
            <Item>
              <AddFolderItem />
            </Item>
          )}
        <NotRootFolder>
          <Item>
            <DownloadButtonItem />
          </Item>
        </NotRootFolder>
        <Item>
          <SelectableItem>
            <a className={styles['fil-action-select']}>
              {t('toolbar.menu_select')}
            </a>
          </SelectableItem>
        </Item>
        <NotRootFolder>
          <hr />
        </NotRootFolder>
        <NotRootFolder>
          <Item>
            <DeleteItem />
          </Item>
        </NotRootFolder>
      </Menu>
    )

    return (
      <div className={styles['fil-toolbar-files']} role="toolbar">
        {!isShared &&
          (cozyDev || cozyRecette ? (
            <IntentButton
              className={styles['u-hide--mob']}
              action="CREATE"
              docType="io.cozy.accounts"
              data={{
                dataType: 'bill',
                closeable: false
              }}
              label={t('service.bills')}
            />
          ) : null)}
        {!isShared &&
          canUpload &&
          hasWriteAccess && <UploadItem disabled={isDisabled} />}
        <NotRootFolder>
          <SharedRecipients />
        </NotRootFolder>
        <NotRootFolder>
          <ShareButton isDisabled={isDisabled} />
        </NotRootFolder>

        {isMobile ? <BarRight>{MoreMenu}</BarRight> : MoreMenu}
      </div>
    )
  }
}
const mapStateToProps = (state, ownProps) => ({
  displayedFolder: state.view.displayedFolder,
  selectionModeActive: isSelectionBarVisible(state)
})

const ToolbarWithSharingContext = props =>
  !props.displayedFolder ? (
    <Toolbar {...props} />
  ) : (
    <SharedDocument docId={props.displayedFolder.id}>
      {({ isShared, hasWriteAccess }) => (
        <Toolbar
          {...props}
          hasWriteAccess={hasWriteAccess}
          isShared={isShared}
        />
      )}
    </SharedDocument>
  )
export default translate()(
  withBreakpoints()(connect(mapStateToProps, null)(ToolbarWithSharingContext))
)
