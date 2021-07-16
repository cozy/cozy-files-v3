import React from 'react'
import { withClient } from 'cozy-client'
class URLGetter extends React.Component {
  componentDidMount() {
    this.getURL()
  }

  async getURL() {
    const { service, client } = this.props

    try {
      const { id } = service.getData()
      const url = await client
        .collection('io.cozy.files')
        .getDownloadLinkById(id)
      service.terminate({ url })
    } catch (error) {
      service.throw(error)
    }
  }
}

export default withClient(URLGetter)
