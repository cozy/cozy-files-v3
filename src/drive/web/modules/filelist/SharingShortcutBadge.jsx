import React from 'react'
import { models } from 'cozy-client'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Badge from 'cozy-ui/transpiled/react/Badge'
import getMimeTypeIcon from 'drive/lib/getMimeTypeIcon'
import { DOCTYPE_FILES } from 'drive/lib/doctypes'
import FileIconShortcut from 'drive/web/modules/filelist/FileIconShortcut'

const SharingShortcutBadge = ({ file, size }) => {
  const targetMimeType = models.file.getSharingShortcutTargetMime(file)
  const targetDoctype = models.file.getSharingShortcutTargetDoctype(file)
  const isShortcut = targetMimeType === 'application/internet-shortcut'
  const targetIsDirectory =
    targetMimeType === '' && targetDoctype === DOCTYPE_FILES

  return isShortcut ? (
    <FileIconShortcut file={file} size={size} />
  ) : (
    <Icon
      icon={getMimeTypeIcon(targetIsDirectory, file.name, targetMimeType)}
      size={size}
    />
  )
}

const withNewStatusBadge = WrappedComponent => {
  const ComponentWithNewStatusBadge = props => {
    const { file } = props
    const isNewSharingShortcut = models.file.isSharingShortcutNew(file)

    return isNewSharingShortcut ? (
      <Badge variant="dot" color="error">
        <WrappedComponent {...props} />
      </Badge>
    ) : (
      <WrappedComponent {...props} />
    )
  }

  return ComponentWithNewStatusBadge
}

export default withNewStatusBadge(SharingShortcutBadge)
