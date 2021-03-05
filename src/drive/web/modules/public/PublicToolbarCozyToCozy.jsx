/* global cozy */
import React, { useState, useCallback } from 'react'

import { useClient } from 'cozy-client'

import BarContextProvider from 'cozy-ui/transpiled/react/BarContextProvider'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ActionMenu, { ActionMenuItem } from 'cozy-ui/transpiled/react/ActionMenu'
import cozyBar from 'lib/cozyBar'

import SelectableItem from 'drive/web/modules/drive/Toolbar/selectable/SelectableItem'

import { MoreButton } from 'components/Button'
import { SharingBannerCozyToCozy } from 'components/sharing/PublicBanner'
import { downloadFiles } from 'drive/web/modules/actions/utils'
import { DownloadFilesButton } from './DownloadButton'

const { BarRight } = cozyBar

const openExternalLink = url => (window.location = url)

const MoreMenu = ({
  isSharingShortcutCreated,
  discoveryLink,
  files,
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
        <ActionMenu onClose={closeMenu} autoclose anchorElRef={anchorRef}>
          <ActionMenuItem
            onClick={() => openExternalLink(discoveryLink)}
            left={
              <Icon icon={isSharingShortcutCreated ? 'sync' : 'to-the-cloud'} />
            }
          >
            {isSharingShortcutCreated
              ? t('toolbar.menu_sync_cozy')
              : t('toolbar.add_to_mine')}
          </ActionMenuItem>

          {isMobile && (
            <ActionMenuItem
              onClick={() => downloadFiles(client, files)}
              left={<Icon icon={'download'} />}
            >
              {t('toolbar.menu_download')}
            </ActionMenuItem>
          )}
          {files.length > 1 && <SelectableItem />}
        </ActionMenu>
      )}
    </>
  )
}

const PublicToolbarCozyToCozy = ({
  discoveryLink,
  files,
  isSharingShortcutCreated,
  sharing
}) => {
  const { t } = useI18n()
  const client = useClient()
  const { isMobile } = useBreakpoints()

  const [isOpened, setIsOpened] = useState(true)
  const onClose = useCallback(() => setIsOpened(false), [setIsOpened])

  return (
    <>
      {isOpened && (
        <SharingBannerCozyToCozy
          isSharingShortcutCreated={isSharingShortcutCreated}
          sharing={sharing}
          discoveryLink={discoveryLink}
          onClose={onClose}
        />
      )}
      <BarRight>
        <BarContextProvider client={client} t={t} store={client.store}>
          {!isMobile && (
            <div className="u-m-auto">
              <DownloadFilesButton files={files} />
            </div>
          )}
          <div className="u-m-auto">
            <MoreMenu
              files={files}
              discoveryLink={discoveryLink}
              isSharingShortcutCreated={isSharingShortcutCreated}
              isMobile={isMobile}
            />
          </div>
        </BarContextProvider>
      </BarRight>
    </>
  )
}

export default PublicToolbarCozyToCozy
