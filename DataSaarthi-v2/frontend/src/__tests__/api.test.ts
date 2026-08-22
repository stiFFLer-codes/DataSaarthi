import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../services/api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

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

  it('saveReport sends correct payload via FormData', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        report: {
          id: 'rep-123',
          user_id: 'usr-456',
          title: 'Q4 Anomaly Report',
          content: '# Anomaly\nDetected 2 outliers',
          created_at: '2026-08-22T00:00:00Z',
        },
      }),
    });

    const res = await api.saveReport('usr-456', 'Q4 Anomaly Report', '# Anomaly\nDetected 2 outliers');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/reports/save'),
      expect.objectContaining({ method: 'POST' })
    );
    const form = mockFetch.mock.calls[0][1].body as FormData;
    expect(form.get('user_id')).toBe('usr-456');
    expect(form.get('title')).toBe('Q4 Anomaly Report');
    expect(form.get('content')).toBe('# Anomaly\nDetected 2 outliers');
    expect(res.status).toBe('success');
    expect(res.report.id).toBe('rep-123');
  });

  it('getReports fetches reports for a user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reports: [
          {
            id: 'rep-1',
            user_id: 'usr-456',
            title: 'Report 1',
            content: 'Content 1',
            created_at: '2026-08-22T00:00:00Z',
          },
        ],
      }),
    });

    const res = await api.getReports('usr-456');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/reports/usr-456'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(res.reports).toHaveLength(1);
    expect(res.reports[0].title).toBe('Report 1');
  });

  it('deleteReport sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'deleted' }),
    });

    const res = await api.deleteReport('rep-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/reports/rep-123'),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(res.status).toBe('deleted');
  });
});
