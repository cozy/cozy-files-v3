import React from 'react'
import classNames from 'classnames'

import { withClient } from 'cozy-client'

import { Modal, Button } from 'cozy-ui/transpiled/react'
import styles from 'drive/styles/intentbutton.styl'

class IntentButton extends React.Component {
  state = {
    modalIsOpen: false
  }

  openModal = () => {
    this.setState({
      modalIsOpen: true
    })
  }

  closeModal = () => {
    this.setState({
      modalIsOpen: false
    })
  }

  render() {
    const { className, data, action, docType, label } = this.props
    const { modalIsOpen } = this.state
    return (
      <span className={classNames(styles['intentButton'])}>
        {modalIsOpen && (
          <Modal
            secondaryAction={() => this.closeModal()}
            className={classNames(styles['coz-modal-intent'])}
          >
            <Intent
              action={action}
              docType={docType}
              data={data}
              closeModal={this.closeModal}
            />
          </Modal>
        )}
        <Button
          className={className}
          onClick={() => this.openModal()}
          label={label}
        />
      </span>
    )
  }
}

class Intent extends React.Component {
  componentDidMount() {
    const { action, docType, data, client } = this.props
    client.intents
      .create(action, docType, {
        ...data,
        exposeIntentFrameRemoval: true
      })
      .start(this.intentViewer)
  }

  render() {
    return (
      <div
        id="intentViewer"
        className={classNames(styles['intentViewer'])}
        ref={intentViewer => (this.intentViewer = intentViewer)}
      />
    )
  }
}

export { IntentButton }
export default withClient(Intent)
