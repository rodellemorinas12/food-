// Mock fetch globally before importing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: {},
  abort: jest.fn(),
}));

// Clear all mocks before each test
beforeEach(() => {
  mockFetch.mockClear();
  jest.clearAllMocks();
});

describe('API Helper Functions', () => {
  describe('fetchAPI', () => {
    it('should successfully fetch data', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // Import and test
      const { fetchAPI } = require('./api');
      const result = await fetchAPI('http://localhost:5000/api/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      const { fetchAPI } = require('./api');
      await expect(fetchAPI('http://localhost:5000/api/test')).rejects.toThrow('Not found');
    });

    it('should throw error on timeout', async () => {
      let abortCallback;
      const mockAbortController = {
        signal: {},
        abort: jest.fn(),
      };
      global.AbortController = jest.fn().mockImplementation(() => mockAbortController);
      
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const { fetchAPI } = require('./api');
      await expect(fetchAPI('http://localhost:5000/api/test')).rejects.toThrow('Request timeout');
    });

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { fetchAPI } = require('./api');
      await fetchAPI('http://localhost:5000/api/test', {
        method: 'POST',
        headers: { 'X-Custom-Header': 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'value',
          }),
        })
      );
    });

    it('should send JSON body for POST requests', async () => {
      const postData = { name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      const { fetchAPI } = require('./api');
      await fetchAPI('http://localhost:5000/api/test', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });
  });
});
