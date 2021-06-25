require('jest-fetch-mock').enableMocks()

import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
global.cozy = {
  bar: {
    BarLeft: () => null,
    BarRight: ({ children }) => children,
    BarCenter: () => null,
    setTheme: () => null
  }
}

Enzyme.configure({ adapter: new Adapter() })
