import React, { Component } from 'react'
import { translate } from 'cozy-ui/react/I18n'
import { withClient } from 'cozy-client'
import NewModal from './NewModal'
import DocumentQualification from './DocumentQualification'
import { getItemById, getThemeByItem } from './DocumentTypeData'
class EditDocumentQualification extends Component {
  state = {
    qualification: undefined
  }
  render() {
    const { document, onClose, t, onSave, client } = this.props
    const { qualification } = this.state
    console.log('document', document)
    const item = document.metadata.id ? getItemById(document.metadata.id) : null
    console.log('item', item)
    const theme = getThemeByItem(item)
    console.log({ theme })
    const categoryLabel = item ? theme.label : null
    return (
      <NewModal
        title={t('Scan.qualify')}
        dismissAction={onClose}
        primaryText={t('Scan.apply')}
        primaryAction={async () => {
          const fileCollection = client.collection('io.cozy.files')
          const metadata = fileCollection.createFileMetadata(qualification)
          const test = await fileCollection.updateFileMetadata(document._id, {
            metadata: {
              hhh: 'nnn',
              extractor_version: '5'
            },
            name: 'toto3'
          })
          onClose()
        }}
        primaryType={'regular'}
        secondaryText={t('Scan.cancel')}
        secondaryAction={() => onClose()}
        secondaryType={'secondary'}
        description={
          <DocumentQualification
            onQualified={qualification => {
              this.setState({ qualification })
            }}
            selected={{
              itemId: item.id,
              categoryLabel
            }}
          />
        }
      />
    )
  }
}

export default translate()(withClient(EditDocumentQualification))