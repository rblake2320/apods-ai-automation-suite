import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

// Mock ScrollArea component
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={className} data-testid="scroll-area">
      {children}
    </div>
  ),
}));

describe('Sidebar Component', () => {
  const renderSidebar = (props = {}) => {
    return render(
      <BrowserRouter>
        <Sidebar {...props} />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render sidebar component', () => {
      const { container } = renderSidebar();
      expect(container.querySelector('aside')).toBeInTheDocument();
    });

    it('should render APODS logo and title', () => {
      renderSidebar();
      expect(screen.getByText('APODS')).toBeInTheDocument();
      expect(screen.getByText('AI Automation')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderSidebar();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Automation')).toBeInTheDocument();
      expect(screen.getByText('MCP Servers')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderSidebar({ className: 'custom-class' });
      expect(container.querySelector('aside')).toHaveClass('custom-class');
    });

    it('should render Quick Stats section', () => {
      renderSidebar();
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });

    it('should render version footer', () => {
      renderSidebar();
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`v1.0.0 © ${currentYear}`)).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand', () => {
    it('should start expanded by default', () => {
      const { container } = renderSidebar();
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
      expect(sidebar).not.toHaveClass('w-16');
    });

    it('should collapse when collapse button is clicked', () => {
      const { container } = renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-16');
      expect(sidebar).not.toHaveClass('w-64');
    });

    it('should expand when expand button is clicked', () => {
      const { container } = renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      const expandButton = screen.getByLabelText('Expand sidebar');
      fireEvent.click(expandButton);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
    });

    it('should hide text when collapsed', () => {
      renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      expect(screen.queryByText('APODS')).not.toBeInTheDocument();
      expect(screen.queryByText('Quick Stats')).not.toBeInTheDocument();
    });

    it('should show Menu icon when collapsed', () => {
      renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      const expandButton = screen.getByLabelText('Expand sidebar');
      expect(expandButton.querySelector('.lucide-menu')).toBeInTheDocument();
    });

    it('should show X icon when expanded', () => {
      renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      expect(collapseButton.querySelector('.lucide-x')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render Dashboard link', () => {
      renderSidebar();
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should render Projects link', () => {
      renderSidebar();
      const projectsLink = screen.getByText('Projects').closest('a');
      expect(projectsLink).toHaveAttribute('href', '/projects');
    });

    it('should render Automation link', () => {
      renderSidebar();
      const automationLink = screen.getByText('Automation').closest('a');
      expect(automationLink).toHaveAttribute('href', '/automation');
    });

    it('should render MCP Servers link', () => {
      renderSidebar();
      const mcpLink = screen.getByText('MCP Servers').closest('a');
      expect(mcpLink).toHaveAttribute('href', '/mcp-servers');
    });

    it('should render Settings link', () => {
      renderSidebar();
      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should render navigation icons', () => {
      renderSidebar();
      const nav = screen.getByRole('navigation');
      expect(nav.querySelector('.lucide-layout-dashboard')).toBeInTheDocument();
      expect(nav.querySelector('.lucide-folder-kanban')).toBeInTheDocument();
      expect(nav.querySelector('.lucide-zap')).toBeInTheDocument();
      expect(nav.querySelector('.lucide-server')).toBeInTheDocument();
      expect(nav.querySelector('.lucide-settings')).toBeInTheDocument();
    });

    it('should show title attribute on collapsed nav items', () => {
      renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      const dashboardLink = screen.getByTitle('Dashboard');
      expect(dashboardLink).toBeInTheDocument();
    });
  });

  describe('Quick Stats', () => {
    it('should display active tasks count', () => {
      renderSidebar();
      const activeTasksRow = screen.getByText('Active Tasks').parentElement;
      expect(activeTasksRow?.textContent).toContain('12');
    });

    it('should display projects count', () => {
      renderSidebar();
      const projectsRow = screen.getByText('Projects').parentElement;
      expect(projectsRow?.textContent).toContain('5');
    });

    it('should display success rate', () => {
      renderSidebar();
      const successRateRow = screen.getByText('Success Rate').parentElement;
      expect(successRateRow?.textContent).toContain('98%');
    });

    it('should not show Quick Stats when collapsed', () => {
      renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      expect(screen.queryByText('Quick Stats')).not.toBeInTheDocument();
      expect(screen.queryByText('Active Tasks')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      renderSidebar();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have proper aria-label for collapse button', () => {
      renderSidebar();
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });

    it('should have keyboard accessible navigation links', () => {
      renderSidebar();
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('focus-visible:outline-none');
    });

    it('should have focus ring on navigation items', () => {
      renderSidebar();
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('focus-visible:ring-2');
      });
    });
  });

  describe('Styling', () => {
    it('should have border on the right', () => {
      const { container } = renderSidebar();
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('border-r');
    });

    it('should have transition animation', () => {
      const { container } = renderSidebar();
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('transition-all', 'duration-300');
    });

    it('should highlight active navigation item', () => {
      renderSidebar();
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.className).toContain('hover:bg-accent');
      });
    });
  });

  describe('Logo Section', () => {
    it('should render Zap icon in logo', () => {
      renderSidebar();
      const logoSection = screen.getByText('APODS').parentElement?.parentElement;
      expect(logoSection?.querySelector('.lucide-zap')).toBeInTheDocument();
    });

    it('should have primary background on logo icon', () => {
      renderSidebar();
      const logoIcon = screen
        .getByText('APODS')
        .parentElement?.parentElement?.querySelector('.bg-primary');
      expect(logoIcon).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should render footer with version', () => {
      renderSidebar();
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });

    it('should not show footer when collapsed', () => {
      renderSidebar();
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      expect(screen.queryByText(/v1\.0\.0/)).not.toBeInTheDocument();
    });
  });
});
