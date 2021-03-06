import styles from '../../../styles/toolbar.styl'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Menu, MenuItem, Icon } from 'cozy-ui/transpiled/react'
import UploadIcon from 'cozy-ui/transpiled/react/Icons/Upload'
import CheckboxIcon from 'cozy-ui/transpiled/react/Icons/CheckSquare'

import UploadButton from '../../../components/UploadButton'
import { MoreButton } from 'components/Button'

const MoreMenu = ({ t, disabled, uploadPhotos, selectItems }) => (
  <Menu
    disabled={disabled}
    position="right"
    className={styles['pho-toolbar-menu']}
    component={<MoreButton />}
  >
    <MenuItem icon={<Icon icon={UploadIcon} />} className={'u-hide--desk'}>
      <UploadButton
        onUpload={uploadPhotos}
        disabled={disabled}
        label={t('Toolbar.menu.photo_upload')}
        inMenu
        className={classNames('u-hide--tablet', styles['pho-action-upload'])}
      />
    </MenuItem>
    <hr className={'u-hide--desk'} />
    <MenuItem onSelect={selectItems} icon={<Icon icon={CheckboxIcon} />}>
      {t('Toolbar.menu.select_items')}
    </MenuItem>
  </Menu>
)

MoreMenu.propTypes = {
  disabled: PropTypes.bool,
  uploadPhotos: PropTypes.func.isRequired,
  selectItems: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

const Toolbar = ({ t, disabled = false, uploadPhotos, selectItems }) => (
  <div className={styles['pho-toolbar']} role="toolbar">
    <UploadButton
      className={'u-hide--mob'}
      onUpload={uploadPhotos}
      disabled={disabled}
      label={t('Toolbar.photo_upload')}
    />
    <MoreMenu
      t={t}
      disabled={disabled}
      uploadPhotos={uploadPhotos}
      selectItems={selectItems}
    />
  </div>
)

Toolbar.propTypes = {
  disabled: PropTypes.bool,
  uploadPhotos: PropTypes.func.isRequired,
  selectItems: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default Toolbar
