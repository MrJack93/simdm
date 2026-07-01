import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar, { SIDEBAR_EXPANDED_W, SIDEBAR_RAIL_W } from '@/components/Sidebar';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    NavLink: ({ to, children, className, style, onClick, title, 'aria-label': ariaLabel }) => {
      const isActive = to === '/';
      const classes = typeof className === 'function' ? className({ isActive }) : className;
      const styles = typeof style === 'function' ? style({ isActive }) : style;
      const label = typeof children === 'function' ? children({ isActive }) : children;
      return (
        <a
          href={to}
          className={classes}
          style={styles}
          onClick={(e) => { e.preventDefault(); onClick?.(); }}
          title={title}
          aria-label={ariaLabel}
          data-testid={`navlink-${to}`}
        >
          {label}
        </a>
      );
    },
  };
});

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <Sidebar
        isExpanded={true}
        onToggle={() => {}}
        isMobileOpen={false}
        onMobileClose={() => {}}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('Sidebar — coverage', () => {
  describe('exports', () => {
    it('exports SIDEBAR_EXPANDED_W', () => {
      expect(SIDEBAR_EXPANDED_W).toBe(240);
    });

    it('exports SIDEBAR_RAIL_W', () => {
      expect(SIDEBAR_RAIL_W).toBe(64);
    });
  });

  describe('rendering', () => {
    it('renders the sidebar with aria-label', () => {
      renderSidebar();
      expect(screen.getByLabelText('Meniu principal')).toBeInTheDocument();
    });

    it('renders SIMDM logo link', () => {
      renderSidebar();
      expect(screen.getByText('SIMDM')).toBeInTheDocument();
    });

    it('renders nav links for all routes', () => {
      renderSidebar();
      expect(screen.getByTestId('navlink-/')).toBeInTheDocument();
      expect(screen.getByTestId('navlink-/inventory')).toBeInTheDocument();
      expect(screen.getByTestId('navlink-/maintenance')).toBeInTheDocument();
      expect(screen.getByTestId('navlink-/settings')).toBeInTheDocument();
    });

    it('renders group labels when expanded', () => {
      renderSidebar({ isExpanded: true });
      expect(screen.getByText('GESTIUNE')).toBeInTheDocument();
      expect(screen.getByText('MENTENANȚĂ')).toBeInTheDocument();
      expect(screen.getByText('OPERAȚIONAL')).toBeInTheDocument();
      expect(screen.getByText('SISTEM')).toBeInTheDocument();
    });

    it('hides group labels when collapsed (rail mode)', () => {
      renderSidebar({ isExpanded: false });
      expect(screen.queryByText('GESTIUNE')).not.toBeVisible();
    });
  });

  describe('toggle button', () => {
    it('renders toggle button with correct aria-label when expanded', () => {
      renderSidebar({ isExpanded: true });
      expect(screen.getByRole('button', { name: 'Restrânge meniul lateral' })).toBeInTheDocument();
    });

    it('renders toggle button with correct aria-label when collapsed', () => {
      renderSidebar({ isExpanded: false });
      expect(screen.getByRole('button', { name: 'Extinde meniul lateral' })).toBeInTheDocument();
    });

    it('calls onToggle when toggle button clicked', () => {
      const onToggle = vi.fn();
      renderSidebar({ onToggle });
      fireEvent.click(screen.getByRole('button', { name: /Restrânge|Extinde/i }));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('sets aria-expanded on toggle button', () => {
      renderSidebar({ isExpanded: true });
      const btn = screen.getByRole('button', { name: /Restrânge|Extinde/i });
      expect(btn).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('mobile behavior', () => {
    it('calls onMobileClose when a nav link is clicked', () => {
      const onMobileClose = vi.fn();
      renderSidebar({ onMobileClose });
      fireEvent.click(screen.getByTestId('navlink-/inventory'));
      expect(onMobileClose).toHaveBeenCalled();
    });

    it('calls onMobileClose when backdrop is clicked', () => {
      const onMobileClose = vi.fn();
      renderSidebar({ onMobileClose, isMobileOpen: true });
      // Find the backdrop div (md:hidden class)
      const backdrop = document.querySelector('.md\\:hidden');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onMobileClose).toHaveBeenCalled();
      }
    });

    it('logo click triggers onMobileClose', () => {
      const onMobileClose = vi.fn();
      renderSidebar({ onMobileClose });
      fireEvent.click(screen.getByLabelText('SIMDM – Pagina principală'));
      expect(onMobileClose).toHaveBeenCalled();
    });
  });

  describe('sidebar width', () => {
    it('uses expanded width when isExpanded is true', () => {
      renderSidebar({ isExpanded: true });
      const aside = screen.getByLabelText('Meniu principal');
      expect(aside.style.width).toBe(`${SIDEBAR_EXPANDED_W}px`);
    });

    it('uses rail width when isExpanded is false', () => {
      renderSidebar({ isExpanded: false });
      const aside = screen.getByLabelText('Meniu principal');
      expect(aside.style.width).toBe(`${SIDEBAR_RAIL_W}px`);
    });
  });

  describe('mobile open/close', () => {
    it('translates sidebar when mobile is open', () => {
      renderSidebar({ isMobileOpen: true });
      const aside = screen.getByLabelText('Meniu principal');
      expect(aside.className).toContain('max-md:translate-x-0');
    });

    it('hides sidebar when mobile is closed', () => {
      renderSidebar({ isMobileOpen: false });
      const aside = screen.getByLabelText('Meniu principal');
      expect(aside.className).toContain('max-md:-translate-x-full');
    });
  });

  describe('link styles', () => {
    it('applies active styles to dashboard link', () => {
      renderSidebar();
      const link = screen.getByTestId('navlink-/');
      expect(link.style.color).toContain('accent');
    });

    it('applies non-active styles to other links', () => {
      renderSidebar();
      const link = screen.getByTestId('navlink-/inventory');
      expect(link.style.color).toContain('text-primary');
    });

    it('justifies content to center when collapsed', () => {
      renderSidebar({ isExpanded: false });
      const link = screen.getByTestId('navlink-/inventory');
      expect(link.style.justifyContent).toBe('center');
    });

    it('justifies content to flex-start when expanded', () => {
      renderSidebar({ isExpanded: true });
      const link = screen.getByTestId('navlink-/inventory');
      expect(link.style.justifyContent).toBe('flex-start');
    });
  });

  describe('rail mode behavior', () => {
    it('sets title on links when collapsed for tooltip', () => {
      renderSidebar({ isExpanded: false });
      const link = screen.getByTestId('navlink-/inventory');
      expect(link).toHaveAttribute('title', 'Inventar');
    });

    it('does not set title on links when expanded', () => {
      renderSidebar({ isExpanded: true });
      const link = screen.getByTestId('navlink-/inventory');
      expect(link).not.toHaveAttribute('title');
    });

    it('sets aria-label on links when collapsed', () => {
      renderSidebar({ isExpanded: false });
      const link = screen.getByTestId('navlink-/inventory');
      expect(link).toHaveAttribute('aria-label', 'Inventar');
    });

    it('does not set aria-label on links when expanded', () => {
      renderSidebar({ isExpanded: true });
      const link = screen.getByTestId('navlink-/inventory');
      expect(link).not.toHaveAttribute('aria-label');
    });
  });

  describe('onMobileClose is undefined', () => {
    it('does not crash when onMobileClose is not provided', () => {
      render(
        <MemoryRouter>
          <Sidebar isExpanded={true} onToggle={() => {}} isMobileOpen={false} />
        </MemoryRouter>
      );
      expect(screen.getByText('SIMDM')).toBeInTheDocument();
    });
  });
});
