/* global cozy  */
import styles from '../styles/topbar.styl'

import React, { Component } from 'react'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import { withBreakpoints, BarContextProvider } from 'cozy-ui/transpiled/react'
import { withClient } from 'cozy-client'
import { withRouter } from 'react-router'
import PropTypes from 'prop-types'
import flow from 'lodash/flow'
import SharingProvider from 'cozy-sharing'
import { DOCTYPE_ALBUMS } from 'drive/lib/doctypes'
import cozyBar from 'lib/cozyBar'

const { BarCenter, BarRight, BarLeft } = cozyBar

const KEYCODE_ENTER = 13
const KEYCODE_ESC = 27

class EditableAlbumName extends Component {
  constructor(props) {
    super(props)
    this.ignoreBlurEvent = false // we'll ignore blur events if they are triggered by pressing enter or escape, to prevent `onEdit` from firing twice
    this.inputElement = null
  }

  componentDidMount() {
    if (this.inputElement !== null) {
      this.inputElement.focus()
      this.inputElement.select()
    }
  }

  handleBlur = e => {
    if (!this.ignoreBlurEvent && this.props.onEdit)
      this.props.onEdit(
        e.target.value.trim() !== '' ? e.target.value : this.props.albumName
      )
  }

  handleKeyDown = e => {
    if (e.keyCode === KEYCODE_ENTER && this.props.onEdit) {
      this.ignoreBlurEvent = true
      this.props.onEdit(e.target.value)
    } else if (e.keyCode === KEYCODE_ESC && this.props.onEdit) {
      this.ignoreBlurEvent = true
      this.props.onEdit(this.props.albumName)
    }
  }

  render() {
    const { albumName } = this.props
    return (
      <input
        type="text"
        defaultValue={albumName}
        onKeyDown={this.handleKeyDown}
        onBlur={this.handleBlur}
        ref={elem => {
          this.inputElement = elem
        }}
      />
    )
  }
}

EditableAlbumName.propTypes = {
  albumName: PropTypes.string,
  onEdit: PropTypes.func.isRequired
}

const TopbarTitle = ({ children }) => (
  <h2 data-test-id="pho-content-title" className={styles['pho-content-title']}>
    {children}
  </h2>
)

const BackToAlbumsButton = ({ onClick }) => (
  <div
    role="button"
    data-test-id="pho-content-album-previous"
    className={styles['pho-content-album-previous']}
    onClick={onClick}
  />
)

BackToAlbumsButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export class Topbar extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }
  componentDidMount() {
    const url = this.props.router.location.pathname
    this.parentUrl = url.substring(0, url.lastIndexOf('/'))
  }

  renderTitle() {
    const { t, viewName, albumName = '', onEdit, editing = false } = this.props
    const isAlbumContent = viewName === 'albumContent'

    if (!isAlbumContent) return t(`Nav.${viewName}`)
    else if (editing)
      return <EditableAlbumName albumName={albumName} onEdit={onEdit} />
    else return albumName
  }

  render() {
    const {
      children,
      viewName,
      breakpoints: { isMobile },
      router,
      client,
      t
    } = this.props
    const isAlbumContent = viewName === 'albumContent'
    const title = <TopbarTitle>{this.renderTitle()}</TopbarTitle>
    const responsiveTitle = isMobile ? <BarCenter>{title}</BarCenter> : title
    const responsiveMenu = isMobile ? (
      <BarRight>
        <BarContextProvider client={client} store={this.context.store} t={t}>
          <SharingProvider doctype={DOCTYPE_ALBUMS} documentType="Albums">
            {children}
          </SharingProvider>
        </BarContextProvider>
      </BarRight>
    ) : (
      children
    )

    const backButton = (
      <BackToAlbumsButton onClick={() => router.push(this.parentUrl)} />
    )
    const responsiveBackButton = isMobile ? (
      <BarLeft>{backButton}</BarLeft>
    ) : (
      backButton
    )

    return (
      <div className={styles['pho-content-header']}>
        {isAlbumContent && responsiveBackButton}
        {responsiveTitle}
        {responsiveMenu}
      </div>
    )
  }
}

Topbar.propTypes = {
  viewName: PropTypes.string.isRequired,
  albumName: PropTypes.string,
  t: PropTypes.func.isRequired,
  editing: PropTypes.bool,
  onEdit: PropTypes.func,
  breakpoints: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  children: PropTypes.node
}

Topbar.defaultProps = {
  editing: false,
  onEdit: () => {}
}

export default flow(
  withRouter,
  withClient,
  withBreakpoints(),
  translate()
)(Topbar)
