import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '@/components/Header';
import { useTheme } from '@/components/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';

// Mock dependencies
vi.mock('@/components/ThemeProvider');
vi.mock('@/store/useAuthStore');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header Component', () => {
  const mockToggleTheme = vi.fn();
  const mockLogout = vi.fn();

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useTheme as any).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });

    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render header component', () => {
      renderHeader();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderHeader();
      const searchInput = screen.getByPlaceholderText(/search projects, tasks/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('should render theme toggle button', () => {
      renderHeader();
      const themeButton = screen.getByLabelText(/switch to dark mode/i);
      expect(themeButton).toBeInTheDocument();
    });

    it('should render notifications button', () => {
      renderHeader();
      const notificationsButton = screen.getByLabelText(/notifications/i);
      expect(notificationsButton).toBeInTheDocument();
    });

    it('should render settings button', () => {
      renderHeader();
      const settingsButton = screen.getByLabelText(/settings/i);
      expect(settingsButton).toBeInTheDocument();
    });

    it('should render user avatar', () => {
      renderHeader();
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', mockUser.avatar);
    });
  });

  describe('Theme Toggle', () => {
    it('should show moon icon in light mode', () => {
      (useTheme as any).mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
      });

      renderHeader();
      const themeButton = screen.getByLabelText(/switch to dark mode/i);
      expect(themeButton.querySelector('.lucide-moon')).toBeInTheDocument();
    });

    it('should show sun icon in dark mode', () => {
      (useTheme as any).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
      });

      renderHeader();
      const themeButton = screen.getByLabelText(/switch to light mode/i);
      expect(themeButton.querySelector('.lucide-sun')).toBeInTheDocument();
    });

    it('should toggle theme when button is clicked', () => {
      renderHeader();
      const themeButton = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(themeButton);
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to settings when settings button is clicked', () => {
      renderHeader();
      const settingsButton = screen.getByLabelText(/settings/i);
      fireEvent.click(settingsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('should navigate to settings from user menu', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const settingsMenuItem = screen.getAllByText('Settings')[0];
        fireEvent.click(settingsMenuItem);
        expect(mockNavigate).toHaveBeenCalledWith('/settings');
      });
    });

    it('should navigate to profile from user menu', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const profileMenuItem = screen.getByText('Profile');
        fireEvent.click(profileMenuItem);
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('User Menu', () => {
    it('should display user name in dropdown', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });

    it('should display user email in dropdown', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });

    it('should have profile menu item', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should have settings menu item', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(screen.getAllByText('Settings')[0]).toBeInTheDocument();
      });
    });

    it('should have logout menu item', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByText('Log out')).toBeInTheDocument();
      });
    });
  });

  describe('Logout', () => {
    it('should logout and navigate to login when logout is clicked', async () => {
      renderHeader();
      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const logoutButton = screen.getByText('Log out');
        fireEvent.click(logoutButton);
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('User Initials', () => {
    it('should display user initials when no avatar', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, avatar: undefined },
        logout: mockLogout,
      });

      renderHeader();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle single name', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, name: 'John', avatar: undefined },
        logout: mockLogout,
      });

      renderHeader();
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should handle multiple names', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, name: 'John Michael Doe', avatar: undefined },
        logout: mockLogout,
      });

      renderHeader();
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should show U when no user', () => {
      (useAuthStore as any).mockReturnValue({
        user: null,
        logout: mockLogout,
      });

      renderHeader();
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should have search input with proper aria-label', () => {
      renderHeader();
      const searchInput = screen.getByLabelText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should allow typing in search input', () => {
      renderHeader();
      const searchInput = screen.getByPlaceholderText(/search projects, tasks/i);
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      expect(searchInput).toHaveValue('test query');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for icon buttons', () => {
      renderHeader();
      expect(screen.getByLabelText(/switch to/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/settings/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderHeader();
      const themeButton = screen.getByLabelText(/switch to/i);
      themeButton.focus();
      expect(themeButton).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('should have sticky positioning', () => {
      const { container } = renderHeader();
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('should have backdrop blur effect', () => {
      const { container } = renderHeader();
      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur');
    });

    it('should have border bottom', () => {
      const { container } = renderHeader();
      const header = container.querySelector('header');
      expect(header).toHaveClass('border-b');
    });
  });
});
