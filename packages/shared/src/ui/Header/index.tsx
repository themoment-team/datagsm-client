'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { oauthPost, oauthUrl } from '@repo/shared/api';
import { CLIENT_URL, COOKIE_KEYS, NAV_LINKS } from '@repo/shared/constants';
import { cn, deleteCookie } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  role?: 'admin' | 'client' | 'docs' | 'status' | 'projects';
}

const Header = ({ role = 'client' }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    queryClient.clear();

    try {
      // SSO 세션도 함께 종료한다. 실패해도 이 서비스의 로컬 로그아웃은 막지 않는다.
      await oauthPost(oauthUrl.postLogout(), undefined, { withCredentials: true });
    } catch {
      // no-op
    }

    deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
    deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);

    toast.success('로그아웃 되었습니다.');

    window.location.href = '/';
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        closeMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const links = NAV_LINKS[role];

  return (
    <header className={cn('bg-background border-foreground sticky top-0 z-50 border-b-2')}>
      <div className={cn('container mx-auto flex h-14 items-center justify-between px-4')}>
        {/* Logo */}
        <Link href={CLIENT_URL} className={cn('flex items-center gap-3')}>
          <div
            className={cn(
              'bg-foreground text-background font-pixel flex h-7 w-7 flex-shrink-0 items-center justify-center text-[9px]',
            )}
          >
            D
          </div>
          <span className={cn('text-foreground font-pixel hidden text-[10px] sm:block')}>
            DataGSM
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={cn('hidden items-center gap-5 sm:flex')}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-muted-foreground hover:text-foreground font-mono text-xs uppercase tracking-widest transition-colors',
              )}
            >
              {link.label}
            </Link>
          ))}
          {(role === 'client' || role === 'admin') && (
            <button
              onClick={handleLogout}
              className={cn(
                'border-foreground hover:bg-foreground hover:text-background flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-all',
              )}
            >
              <LogOut className={cn('h-3 w-3')} />
              <span>Logout</span>
            </button>
          )}
        </nav>

        {/* Mobile Menu Trigger */}
        <button
          onClick={toggleMenu}
          className={cn('text-foreground block cursor-pointer p-2 sm:hidden')}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className={cn('h-6 w-6')} /> : <Menu className={cn('h-6 w-6')} />}
        </button>
      </div>

      {/* Mobile Side Menu */}
      <div
        className={cn(
          'bg-background border-foreground fixed bottom-0 right-0 top-14 z-50 w-64 border-l-2 transition-transform duration-300 ease-in-out sm:hidden',
          isMenuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <nav className={cn('flex flex-col gap-4 p-6')}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
              className={cn(
                'text-muted-foreground hover:text-foreground font-mono text-sm uppercase tracking-widest transition-colors',
              )}
            >
              {link.label}
            </Link>
          ))}
          {(role === 'client' || role === 'admin') && (
            <div className={cn('mt-4 border-t pt-4')}>
              <button
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                tabIndex={isMenuOpen ? 0 : -1}
                className={cn(
                  'border-foreground hover:bg-foreground hover:text-background flex w-full cursor-pointer items-center justify-center gap-2 border py-3 font-mono text-xs uppercase tracking-widest transition-all',
                )}
              >
                <LogOut className={cn('h-4 w-4')} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className={cn('fixed inset-0 z-40 bg-black/50 sm:hidden')}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;
