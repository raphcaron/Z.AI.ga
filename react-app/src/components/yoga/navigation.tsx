'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import { AuthModal } from './auth-modal';
import { 
  Menu, 
  User, 
  Heart, 
  LogIn,
  Sparkles,
  LogOut,
  Settings,
  Crown,
  Shield
} from 'lucide-react';

const navLinks = [
  { href: '/sessions', label: 'Library' },
  { href: '/calendar', label: 'Schedule' },
  { href: '/pricing', label: 'Pricing' },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, signOut, isSubscribed } = useAuth();
  const { favorites } = useFavorites();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              Boho Yoga
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/settings?tab=favorites">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Favorites
                    {favorites.size > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                        {favorites.size}
                      </Badge>
                    )}
                  </Button>
                </Link>
                {isSubscribed && (
                  <Badge variant="secondary" className="gap-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    Pro
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.user_metadata?.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata?.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" asChild>
                      <Link href="/settings?tab=profile">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" asChild>
                      <Link href="/settings?tab=favorites">
                        <Heart className="h-4 w-4" />
                        Favorites
                        {favorites.size > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                            {favorites.size}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" asChild>
                      <Link href="/settings?tab=subscription">
                        <Settings className="h-4 w-4" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" asChild>
                      <Link href="/admin">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 rounded-lg text-red-600 cursor-pointer" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setAuthModalOpen(true)}>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setAuthModalOpen(true)}>
                  <User className="h-4 w-4" />
                  Subscribe
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] rounded-l-2xl">
              <div className="flex flex-col gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-semibold">Boho Yoga</span>
                </div>
                
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col gap-3 mt-4">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-accent">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.user_metadata?.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.user_metadata?.name || 'User'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/settings?tab=profile" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 rounded-xl" 
                        >
                          <User className="h-4 w-4" />
                          Profile Settings
                        </Button>
                      </Link>
                      <Link href="/settings?tab=favorites" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 rounded-xl"
                        >
                          <Heart className="h-4 w-4" />
                          Favorites
                          {favorites.size > 0 && (
                            <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                              {favorites.size}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Link href="/admin" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 rounded-xl"
                        >
                          <Shield className="h-4 w-4" />
                          Admin
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-red-600" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => { setIsOpen(false); setAuthModalOpen(true); }}>
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </Button>
                      <Button className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90" onClick={() => { setIsOpen(false); setAuthModalOpen(true); }}>
                        <User className="h-4 w-4" />
                        Subscribe
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
