/* global cozy */
import { getTracker } from 'cozy-ui/transpiled/react/helpers/tracker'

export const track = element => {
  const tracker = getTracker()
  tracker &&
    tracker.push(['trackEvent', 'interaction', 'desktop-prompt', element])
}

export const isLinux = () =>
  window.navigator &&
  (window.navigator.appVersion.indexOf('Win') === -1 &&
    window.navigator.appVersion.indexOf('Mac') === -1)
export const isAndroid = () =>
  window.navigator.userAgent &&
  window.navigator.userAgent.indexOf('Android') >= 0
export const isIOS = () =>
  window.navigator.userAgent &&
  /iPad|iPhone|iPod/.test(window.navigator.userAgent)

export const DESKTOP_BANNER = 'desktop_banner'
export const NOVIEWER_DESKTOP_CTA = 'noviewer_desktop_cta'

export const isClientAlreadyInstalled = async client => {
  const resp = await client.query(client.get('io.cozy.settings', 'clients'))
  return resp.some(
    device =>
      device.attributes.software_id === 'github.com/cozy-labs/cozy-desktop'
  )
}
