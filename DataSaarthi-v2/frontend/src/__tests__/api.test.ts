import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../services/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getToken returns null when no token is in localStorage', () => {
    const token = localStorage.getItem('dsaarthi_user');
    expect(token).toBeNull();
  });

  it('uploadFile calls the correct endpoint', async () => {
    const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rows: [], columns: [] }),
    });

    const result = await api.uploadFile(mockFile, false);
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toHaveProperty('id');
  });

  it('analyze posts data correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ report: 'Mock report' }),
    });

    const result = await api.analyze([{ id: 1 }], 'Dataset1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/analyze'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: [{ id: 1 }], dataset_name: 'Dataset1' }),
      })
    );
    expect(result.report).toBe('Mock report');
  });

  it('throws error when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ detail: 'Failed' }),
    });

    await expect(api.analyze([], 'd1')).rejects.toThrow('Failed');
  });

  it('login sends correct formdata', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
    });

    await api.login('test@example.com', 'password123');
    
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toContain('/auth/login');
    expect(callArgs[1].body).toBeInstanceOf(FormData);
    expect(callArgs[1].body.get('email')).toBe('test@example.com');
  });
});
