/* global __TARGET__ */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import snarkdown from 'snarkdown'
import PropTypes from 'prop-types'

import Icon from 'cozy-ui/transpiled/react/Icon'
import Button from 'cozy-ui/transpiled/react/Button'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { translate } from 'cozy-ui/transpiled/react'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { unlink } from './duck'
import tosIcon from 'drive/mobile/assets/icons/icon-tos.svg'

const TosUpdatedModal = translate()(({ t, newTosLink, onAccept, onRefuse }) => {
  const updatedDetails = snarkdown(
    t('TOS.updated.detail', { link: newTosLink })
  )

  return (
    <ConfirmDialog
      open
      content={
        <>
          <Typography align="center" paragraph>
            <Icon icon={tosIcon} width={96} height={96} />
          </Typography>
          <Typography variant="h3" align="center" paragraph>
            {t('TOS.updated.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            <div dangerouslySetInnerHTML={{ __html: updatedDetails }} />
          </Typography>
        </>
      }
      actionsLayout="column"
      actions={
        <>
          <Button
            subtle
            size="small"
            className="u-mt-1"
            label={t('TOS.updated.disconnect')}
            onClick={onRefuse}
          />
          <Button label={t('TOS.updated.cta')} onClick={onAccept} />
        </>
      }
    />
  )
})

class UserActionRequired extends Component {
  static contextTypes = {
    client: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired
  }

  state = {
    warnings: []
  }

  componentDidMount() {
    if (__TARGET__ === 'mobile') {
      this.checkIfUserActionIsRequired()
      document.addEventListener('resume', this.checkIfUserActionIsRequired)
    }
  }

  componentWillUnmount() {
    if (__TARGET__ === 'mobile') {
      document.removeEventListener('resume', this.checkIfUserActionIsRequired)
    }
  }

  checkIfUserActionIsRequired = async () => {
    const { client, router } = this.context
    try {
      await client.getStackClient().fetch('GET', '/data/')
      const wasBlocked = this.state.warnings.length !== 0
      if (wasBlocked) {
        this.setState({ warnings: [] })
        router.replace('/')
      }
    } catch (e) {
      if (e.status === 402) {
        this.setState({ warnings: e.reason })
      }
    }
  }

  acceptUpdatedTos = async () => {
    const { client, router } = this.context
    try {
      await client.getClient().fetch('PUT', '/settings/instance/sign_tos')
      this.setState({
        warnings: this.state.warnings.filter(w => w.code !== 'tos-updated')
      })
      router.replace('/')
    } catch (e) {
      Alerter.error('TOS.updated.error')
    }
  }

  disconnect = async () => {
    const { client, router } = this.context
    const { unlink, clientSettings } = this.props
    unlink(client, clientSettings)
    router.replace('/onboarding')
  }

  render() {
    const { warnings } = this.state
    if (warnings.length === 0) return null

    const tosUpdated = warnings.find(w => w.code === 'tos-updated')
    if (tosUpdated) {
      return (
        <TosUpdatedModal
          newTosLink={tosUpdated.links.self}
          onAccept={this.acceptUpdatedTos}
          onRefuse={this.disconnect}
        />
      )
    }
  }
}

const mapDispatchToProps = dispatch => ({
  unlink: client => dispatch(unlink(client))
})

export default connect(
  null,
  mapDispatchToProps
)(UserActionRequired)
