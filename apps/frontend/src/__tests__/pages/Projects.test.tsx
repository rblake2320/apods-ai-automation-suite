import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Projects from '@/pages/Projects';

vi.mock('@/store/useProjectStore', () => ({
  useProjectStore: vi.fn(() => ({
    projects: [],
    fetchProjects: vi.fn(),
    isLoading: false,
  })),
}));

describe('Projects Page', () => {
  const renderProjects = () => {
    return render(
      <BrowserRouter>
        <Projects />
      </BrowserRouter>
    );
  };

  it('should render projects page', () => {
    renderProjects();
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
  });

  it('should show empty state when no projects', () => {
    renderProjects();
    expect(screen.getByText(/no projects/i)).toBeInTheDocument();
  });
});
