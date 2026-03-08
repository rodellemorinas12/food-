// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
jest.mock('./theme', () => ({
  tokens: jest.fn(() => ({
    grey: { 100: '#e0e0e0', 500: '#666666', 700: '#3d3d3d' },
    primary: { 400: '#1F2A40', 500: '#141b2d' },
    greenAccent: { 500: '#4cceac', 600: '#3da58a' },
    blueAccent: { 700: '#6870fa' },
  })),
  useMode: jest.fn(() => [
    { palette: { mode: 'dark' } },
    { toggleColorMode: jest.fn() }
  ]),
  ColorModeContext: { Provider: ({ children }) => children },
}));

// Mock API functions
jest.mock('./api', () => ({
  fetchStats: jest.fn(),
  fetchTransactions: jest.fn(),
  fetchTeams: jest.fn(),
  fetchContacts: jest.fn(),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
