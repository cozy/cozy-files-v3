import { t } from 'testcafe'
import { PRECISION } from '../../helpers/visualreview-utils'
import PublicDriveVRPage from '../drive/drive-model-public'
import ViewerPage from './drive-viewer-model'

const publicDrivePage = new PublicDriveVRPage()

export default class PublicViewerPage extends ViewerPage {
  // perform checks commons to all viewer : navigation / toolbar download btn / closing viewer
  //@param {String} screenshotPath : path for screenshots taken in this test
  //@param {string} filename : file to check
  //@param {string} type : file type to check for Specific viewer
  async checkPublicViewer(screenshotPath, fileName, type, hasMask = false) {
    const index = await publicDrivePage.getElementIndex(fileName)
    console.log(`↳ 📁 ${fileName} with index : ${index}`)
    await this.openViewerForFile(fileName)

    switch (type) {
      case 'img':
        await this.checkImageViewer()
        break
      case 'txt':
        await this.checkTextViewer()
        break
      case 'audio':
        await this.checkAudioViewer()
        break
      case 'video':
        await this.checkVideoViewer()
        break
      default:
        await this.checkNoViewer()
        break
    }
    //avoid unwanted hover for screenshots
    await t.hover(this.viewerControls, {
      offsetX: 0,
      offsetY: 0
    })
    await t.fixtureCtx.vr.takeScreenshotAndUpload(screenshotPath, hasMask)
    //precision back to default
    t.fixtureCtx.vr.options.compareSettings = {
      precision: PRECISION //precision goes from 0 to 255
    }
  }

  //@param {String} screenshotPath : path for screenshots taken in this test
  //@param {string} filename : file to check
  async checkMobilePublicViewer(screenshotsPath, fileName, hasMask = false) {
    await t.resizeWindowToFitDevice('iPhone 6', {
      portraitOrientation: true
    })

    await this.openViewerForFile(fileName)
    //avoid unwanted hover for screenshots
    await t.hover(this.viewerControls, {
      offsetX: 0,
      offsetY: 0
    })

    await t.fixtureCtx.vr.takeScreenshotAndUpload(screenshotsPath, hasMask)
    await t.maximizeWindow() //Back to desktop
  }
}
