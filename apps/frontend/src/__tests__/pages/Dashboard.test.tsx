import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { name: 'Test User' },
    isAuthenticated: true,
  })),
}));

describe('Dashboard Page', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('should render dashboard', () => {
    renderDashboard();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should show user greeting', () => {
    renderDashboard();
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });

  it('should display stats cards', () => {
    renderDashboard();
    const cards = screen.getAllByRole('generic');
    expect(cards.length).toBeGreaterThan(0);
  });
});
