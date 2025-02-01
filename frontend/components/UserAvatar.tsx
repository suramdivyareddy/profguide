'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "next/navigation"

export function UserAvatar() {
  const { user, logout } = useUser()
  const router = useRouter()

  if (!user) {
    return (
      <Button variant="outline" onClick={() => router.push('/auth?tab=login')}>
        Login
      </Button>
    )
  }

  // Get initials from display name
  const initials = user.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">Welcome, {user.displayName}</span>
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <Button variant="outline" onClick={() => logout(false)}>
        Logout
      </Button>
    </div>
  )
}
