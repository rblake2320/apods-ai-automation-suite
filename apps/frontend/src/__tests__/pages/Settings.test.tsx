import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '@/pages/Settings';

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { name: 'Test', email: 'test@example.com' },
  })),
}));

vi.mock('@/store/useThemeStore', () => ({
  useThemeStore: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

describe('Settings Page', () => {
  const renderSettings = () => {
    return render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );
  };

  it('should render settings page', () => {
    renderSettings();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('should display user information', () => {
    renderSettings();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });
});
