/* global cozy */
import React, { useState, useCallback, useContext } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { useClient } from 'cozy-client'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import Button from 'cozy-ui/transpiled/react/Button'
import ActionMenu, { ActionMenuItem } from 'cozy-ui/transpiled/react/ActionMenu'
import Icon from 'cozy-ui/transpiled/react/Icon'
import BarContextProvider from 'cozy-ui/transpiled/react/BarContextProvider'
import cozyBar from 'lib/cozyBar'

import { ModalContext } from 'drive/lib/ModalContext'
import { MoreButton } from 'components/Button'
import EmptyTrashConfirm from './components/EmptyTrashConfirm'
import { emptyTrash } from 'drive/web/modules/actions/utils'

import { isSelectionBarVisible } from 'drive/web/modules/selection/duck'

import styles from 'drive/styles/toolbar.styl'

import SelectableItem from '../drive/Toolbar/selectable/SelectableItem'

export const Toolbar = ({
  t,
  disabled,
  selectionModeActive,
  breakpoints: { isMobile }
}) => {
  const client = useClient()
  const { BarRight } = cozyBar
  const [menuIsVisible, setMenuVisible] = useState(false)
  const anchorRef = React.createRef()
  const openMenu = useCallback(() => setMenuVisible(true), [setMenuVisible])
  const closeMenu = useCallback(() => setMenuVisible(false), [setMenuVisible])

  const { pushModal, popModal } = useContext(ModalContext)

  const onEmptyTrash = useCallback(
    () => {
      pushModal(
        <EmptyTrashConfirm
          onClose={popModal}
          onConfirm={() => {
            emptyTrash(client)
          }}
        />
      )
    },
    [pushModal, popModal, client]
  )

  const MoreMenu = (
    <div>
      <div ref={anchorRef}>
        <MoreButton onClick={openMenu} />
      </div>
      {menuIsVisible && (
        <ActionMenu
          placement="bottom-end"
          anchorElRef={anchorRef}
          onClose={closeMenu}
          autoclose
        >
          {isMobile && (
            <>
              <ActionMenuItem
                onClick={onEmptyTrash}
                left={<Icon icon="trash" color="var(--pomegranate)" />}
              >
                <span className="u-pomegranate">
                  {t('toolbar.empty_trash')}
                </span>
              </ActionMenuItem>
              <hr />
            </>
          )}
          <SelectableItem />
        </ActionMenu>
      )}
    </div>
  )

  return (
    <div
      data-test-id="empty-trash"
      className={styles['fil-toolbar-trash']}
      role="toolbar"
    >
      {!isMobile && (
        <Button
          theme="danger-outline"
          onClick={onEmptyTrash}
          disabled={disabled || selectionModeActive}
          icon="trash"
          label={t('toolbar.empty_trash')}
        />
      )}

      {isMobile ? (
        <BarRight>
          <BarContextProvider client={client} t={t} store={client.store}>
            {MoreMenu}
          </BarContextProvider>
        </BarRight>
      ) : (
        MoreMenu
      )}
    </div>
  )
}

const mapStateToProps = state => ({
  selectionModeActive: isSelectionBarVisible(state)
})

export default compose(
  translate(),
  withBreakpoints(),
  connect(
    mapStateToProps,
    null
  )
)(Toolbar)
