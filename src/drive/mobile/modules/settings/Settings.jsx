/* globals __DEVELOPMENT__ */

import React, { Component } from 'react'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'

import cozyBar from 'lib/cozyBar'

import Main from 'drive/web/modules/layout/Main'

import DebugTools from './components/DebugTools'
import About from './components/About'
import Support from './components/Support'
import MediaBackup from './components/MediaBackup'
import Unlink from './components/Unlink'
import FeedbackForm from './components/FeedbackForm'
import ScrollToTop from 'drive/web/modules/navigation/ScrollToTop'
import RealTimeQueries from 'drive/lib/RealTimeQueries'
import styles from './styles.styl'

const { BarCenter } = cozyBar

class Settings extends Component {
  state = {
    tapCount: 0,
    displayFeedback: false
  }

  incrementTapCount = () => {
    this.setState(state => ({ tapCount: state.tapCount + 1 }))
  }

  displayFeedbackForm = () => {
    this.setState(state => ({ ...state, displayFeedback: true }))
  }
  hideFeedbackForm = result => {
    this.setState(state => ({ ...state, displayFeedback: false }))
    result && Alerter.info('mobile.rating.alert.feedback')
  }

  render() {
    const { t } = this.props
    const isDebug = this.state.tapCount >= 3
    /*
    See https://reacttraining.com/react-router/web/guides/scroll-restoration
    for the ScrollToTop explanation
    */
    return (
      <Main>
        <ScrollToTop />
        <RealTimeQueries doctype="io.cozy.files" />
        <BarCenter>
          <h2 className={styles['settings__title']}>
            {t('mobile.settings.title')}
          </h2>
        </BarCenter>
        <div>
          <div className={styles['settings']}>
            <MediaBackup />
            <Support
              isDebug={isDebug}
              sendFeedback={this.displayFeedbackForm}
            />
            <About onTap={this.incrementTapCount} />
            <Unlink />

            {(__DEVELOPMENT__ || isDebug) && [
              <hr key={1} />,
              <h3 key={2}>Debug Zone</h3>,
              <DebugTools key={3} />
            ]}
          </div>
          {this.state.displayFeedback && (
            <FeedbackForm onClose={this.hideFeedbackForm} />
          )}
        </div>
      </Main>
    )
  }
}

export default translate()(Settings)
