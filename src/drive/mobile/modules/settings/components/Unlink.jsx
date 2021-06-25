import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { withClient } from 'cozy-client'
import { connect } from 'react-redux'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import SettingCategory, { ELEMENT_BUTTON } from './SettingCategory'
import { unlink } from 'drive/mobile/modules/authorization/duck'

export class Unlink extends Component {
  render() {
    const { t, unlink, client } = this.props
    return (
      <div>
        <SettingCategory
          title={t('mobile.settings.unlink.title')}
          elements={[
            {
              type: ELEMENT_BUTTON,
              description: t('mobile.settings.unlink.description'),
              text: t('mobile.settings.unlink.button'),
              theme: 'danger-outline',
              onClick: () => unlink(client)
            }
          ]}
        />
      </div>
    )
  }
}
Unlink.propTypes = {
  t: PropTypes.func,
  unlink: PropTypes.func,
  router: PropTypes.object
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  unlink: client => {
    dispatch(unlink(client))
    ownProps.router.replace('/onboarding')
  }
})

export default withRouter(
  connect(
    null,
    mapDispatchToProps
  )(translate()(withClient(Unlink)))
)
