import React from 'react'

import { withClient } from 'cozy-client'

import Embeder from './Embeder'
import URLGetter from './URLGetter'
import SuggestionProvider from './SuggestionProvider'

class IntentHandler extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      component: null,
      service: null,
      intent: null
    }
  }

  componentDidMount() {
    this.startService()
  }

  async startService() {
    const { intentId, client } = this.props

    let component
    let service
    let intent
    try {
      service = await client.intents.createService(intentId, window)
      intent = service.getIntent()

      if (
        intent.attributes.action === 'OPEN' &&
        intent.attributes.type === 'io.cozy.suggestions'
      ) {
        component = SuggestionProvider
      } else if (
        intent.attributes.action === 'OPEN' &&
        intent.attributes.type === 'io.cozy.files'
      ) {
        component = Embeder
      } else if (intent.attributes.action === 'GET_URL') {
        component = URLGetter
      }

      this.setState({
        component,
        service,
        intent
      })
    } catch (error) {
      service.throw(error)
    }
  }

  render() {
    const { service, intent } = this.state
    const ServiceComponent = this.state.component

    return ServiceComponent ? (
      <ServiceComponent service={service} intent={intent} />
    ) : (
      <div className="u-w-100 u-bg-charcoalGrey" />
    )
  }
}

export default withClient(IntentHandler)
