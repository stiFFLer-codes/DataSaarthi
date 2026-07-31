import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    guestLogin: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with null user if no token in localStorage', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('loads user from localStorage on mount', () => {
    const mockAuth = { user: { id: '1', email: 'test@example.com' }, token: 'mock-token' };
    localStorage.setItem('dsaarthi_user', JSON.stringify(mockAuth));
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toEqual(mockAuth.user);
    expect(result.current.token).toBe(mockAuth.token);
  });

  it('login method updates state and localStorage', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login({ id: '2', email: 'user@example.com' }, 'new-token');
    });

    expect(result.current.user).toEqual({ id: '2', email: 'user@example.com' });
    expect(result.current.token).toBe('new-token');
    
    const stored = JSON.parse(localStorage.getItem('dsaarthi_user') || '{}');
    expect(stored.token).toBe('new-token');
  });

  it('logout method clears state and localStorage', () => {
    const mockAuth = { user: { id: '1', email: 'test@example.com' }, token: 'mock-token' };
    localStorage.setItem('dsaarthi_user', JSON.stringify(mockAuth));
    
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('dsaarthi_user')).toBeNull();
  });

  it('guestLogin calls api and logs in', async () => {
    const mockData = { user: { id: 'guest', email: 'guest@d.local' }, access_token: 'guest-token' };
    vi.mocked(api.guestLogin).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.guestLogin();
    });

    expect(api.guestLogin).toHaveBeenCalledOnce();
    expect(result.current.user).toEqual(mockData.user);
    expect(result.current.token).toBe('guest-token');
  });
});
