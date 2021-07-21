import React from 'react'

import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { Button } from 'cozy-ui/transpiled/react/Button'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

export const MigrateAdapter = ({ shouldMigrateAdapter }) => {
  const { t } = useI18n()

  const onClose = () => {
    shouldMigrateAdapter(false)
  }

  const onConfirm = async () => {
    shouldMigrateAdapter(true)
  }

  return (
    <ConfirmDialog
      open={true}
      onClose={onClose}
      title={t('Migration.title')}
      content={t('Migration.content')}
      actions={
        <>
          <Button
            theme="primary"
            label={t('Migration.confirm')}
            onClick={onConfirm}
          />
          <Button
            theme="secondary"
            label={t('Migration.cancel')}
            onClick={onClose}
          />
        </>
      }
    />
  )
}
