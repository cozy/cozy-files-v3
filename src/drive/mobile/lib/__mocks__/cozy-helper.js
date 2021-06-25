const mockStackClient = {
  setOAuthOptions: jest.fn(),
  setCredentials: jest.fn()
}

const mock = {
  getLang: jest.fn(),
  initClient: jest.fn(() => ({
    getStackClient: jest.fn(() => mockStackClient)
  })),
  initBar: jest.fn(),
  resetClient: jest.fn(),
  getOauthOptions: jest.fn()
}

module.exports = mock
