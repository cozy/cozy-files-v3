/* global cozy */


import React, { useCallback, useState } from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import BarContextProvider from 'cozy-ui/transpiled/react/BarContextProvider'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import { Button, ButtonLink, Icon } from 'cozy-ui/transpiled/react'
import ActionMenu, { ActionMenuItem } from 'cozy-ui/transpiled/react/ActionMenu'
import { useClient } from 'cozy-client'
import cozyBar from 'lib/cozyBar'

import getHomeLinkHref from 'components/Button/getHomeLinkHref'
import CozyHomeLinkIcon from 'components/Button/CozyHomeLinkIcon'
import { SharingBannerByLink } from 'components/sharing/PublicBanner'

import { DownloadFilesButton } from './DownloadButton'

import SelectableItem from 'drive/web/modules/drive/Toolbar/selectable/SelectableItem'
import AddFolderItem from 'drive/web/modules/drive/Toolbar/components/AddFolderItem'
import UploadItem from 'drive/web/modules/drive/Toolbar/components/UploadItem'
import CreateShortcut from 'drive/web/modules/drive/Toolbar/components/CreateShortcut'

import { downloadFiles } from 'drive/web/modules/actions/utils'
const { BarRight } = cozyBar
const isFilesIsFile = files => files.length === 1 && files[0].type === 'file'

const CreateCozyButton = ({ from, size }) => {
  const { t } = useI18n()
  return (
    <ButtonLink
      label={t('Share.create-cozy')}
      icon={CozyHomeLinkIcon}
      href={getHomeLinkHref(from)}
      size={size}
    />
  )
}
const MoreButton = ({ disabled, onClick }) => {
  const { t } = useI18n()
  return (
    <Button
      data-test-id="more-button"
      theme="secondary"
      disabled={disabled}
      onClick={onClick}
      extension="narrow"
      icon="dots"
      iconOnly
      label={t('Toolbar.more')}
    />
  )
}
const MoreMenu = ({
  files,
  hasWriteAccess,
  refreshFolderContent,
  isMobile
}) => {
  const { t } = useI18n()
  const client = useClient()
  const anchorRef = React.createRef()

  const [menuIsVisible, setMenuVisible] = useState(false)

  const openMenu = useCallback(() => setMenuVisible(true), [setMenuVisible])
  const closeMenu = useCallback(() => setMenuVisible(false), [setMenuVisible])
  const toggleMenu = useCallback(
    () => {
      if (menuIsVisible) return closeMenu()
      openMenu()
    },
    [closeMenu, openMenu, menuIsVisible]
  )
  return (
    <>
      <div ref={anchorRef}>
        <MoreButton onClick={toggleMenu} />
      </div>
      {menuIsVisible && (
        <ActionMenu onClose={closeMenu} autoclose>
          {isMobile && (
            <ActionMenuItem
              onClick={() => getHomeLinkHref('sharing-drive')}
              left={<Icon icon={'to-the-cloud'} />}
            >
              {t('Share.create-cozy')}
            </ActionMenuItem>
          )}
          {isMobile && (
            <ActionMenuItem
              onClick={() => downloadFiles(client, files)}
              left={<Icon icon={'download'} />}
            >
              {t('toolbar.menu_download')}
            </ActionMenuItem>
          )}
          {hasWriteAccess && <AddFolderItem />}
          {hasWriteAccess && (
            <CreateShortcut onCreated={refreshFolderContent} />
          )}
          {hasWriteAccess && <UploadItem onUploaded={refreshFolderContent} />}
          {files.length > 1 && <SelectableItem />}
        </ActionMenu>
      )}
    </>
  )
}
const PublicToolbarByLink = ({
  files,
  hasWriteAccess,
  refreshFolderContent
}) => {
  const { t } = useI18n()
  const isFile = isFilesIsFile(files)
  const client = useClient()
  const { isMobile } = useBreakpoints()

  const shouldDisplayMoreMenu =
    isMobile || (!isFile && files.length > 0) || hasWriteAccess
  const [isOpened, setIsOpened] = useState(true)
  const onClose = useCallback(() => setIsOpened(false), [setIsOpened])

  return (
    <>
      {isOpened && <SharingBannerByLink onClose={onClose} />}

      <BarRight>
        <BarContextProvider client={client} t={t} store={client.store}>
          {!isMobile && (
            <>
              <div className="u-m-auto">
                <DownloadFilesButton files={files} />
              </div>
              <div className="u-m-auto">
                <CreateCozyButton from="sharing-drive" />
              </div>
            </>
          )}
          {shouldDisplayMoreMenu && (
            <div className="u-m-auto">
              <MoreMenu
                hasWriteAccess={hasWriteAccess}
                refreshFolderContent={refreshFolderContent}
                isMobile={isMobile}
                files={files}
              />
            </div>
          )}
        </BarContextProvider>
      </BarRight>
    </>
  )
}

export default PublicToolbarByLink
