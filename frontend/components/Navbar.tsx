'use client';

import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';

export function Navbar() {
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  const handleAuthClick = (tab: 'login' | 'signup') => {
    router.push(`/auth?tab=${tab}`);
  };

  return (
    <nav className="bg-[#006747] p-4 flex justify-between items-center">
      <Link href="/" className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
        <Image 
          src="/bull.svg"
          alt="Bull Icon"
          width={40}
          height={32}
          className="mr-2"
        />
        <h1 className="text-white text-2xl font-sports-world tracking-wider">ProfGuide</h1>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <img 
                src={`https://api.dicebear.com/9.x/identicon/svg?seed=${user.displayName}`}
                alt="User Avatar"
                className="w-10 h-10 rounded-full bg-white"
              />
              <div className="flex flex-col">
                <span className="text-white leading-tight">Welcome, <span className="font-bold">{user.displayName}</span></span>
                <span className="text-white/80 text-sm leading-tight">{user.email}</span>
              </div>
            </div>
            {user?.isAdmin && (
              <Button 
                className="text-black bg-white hover:text-black hover:bg-white focus-none font-bold" 
                onClick={() => router.push('/admin')}
              >
                Admin
              </Button>
            )}
            <Button className="text-black bg-white hover:text-black hover:bg-white focus-none font-bold" onClick={() => logout(false)}>
              Logout
            </Button>
          </>
        ) : !isAuthPage && (
          <>
            <Button className="text-black bg-white hover:text-black hover:bg-white focus-none font-bold" onClick={() => handleAuthClick('login')}>
              Login
            </Button>
            <Button className="text-black bg-white hover:text-black hover:bg-white focus-none font-bold" onClick={() => handleAuthClick('signup')}>
              Signup
            </Button>
          </>
        )}
      </div>
    </nav>
  );
} 