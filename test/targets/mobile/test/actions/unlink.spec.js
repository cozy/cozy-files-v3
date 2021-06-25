/* eslint-env jest */
import {
  SHOW_UNLINK_CONFIRMATION,
  HIDE_UNLINK_CONFIRMATION,
  showUnlinkConfirmation,
  hideUnlinkConfirmation,
  unlink
} from '../../../../../src/targets/mobile/actions/unlink'

describe('ui actions', () => {
  it('should create an action to display unlink confirmation', () => {
    const expectedAction = { type: SHOW_UNLINK_CONFIRMATION }
    expect(showUnlinkConfirmation()).toEqual(expectedAction)
  })

  it('should create an action to hide unlink confirmation', () => {
    const expectedAction = { type: HIDE_UNLINK_CONFIRMATION }
    expect(hideUnlinkConfirmation()).toEqual(expectedAction)
  })

  it('should create an action to initialize state', () => {
    const expectedAction = { type: 'UNLINK' }
    expect(unlink()).toEqual(expectedAction)
  })
})
