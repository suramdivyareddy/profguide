'use client';

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CompactLoginForm } from "@/components/CompactLoginForm"
import { CompactSignUpForm } from "@/components/CompactSignUpForm"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button";


interface AuthRequiredActionProps {
  children: React.ReactNode;  // The protected content (e.g., RatingForm)
  trigger: React.ReactNode;   // The trigger element (e.g., Button)
}

export function AuthRequiredAction({ children, trigger }: AuthRequiredActionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const { user } = useUser()

  const handleLoginSuccess = () => {
    setShowSignUp(false)
    // Don't close the sheet, just update the content to show children
  }

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setShowSignUp(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="outline-none focus:outline-none focus-visible:ring-0">
        {user ? (
          children
        ) : showSignUp ? (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="mb-2"
              onClick={() => setShowSignUp(false)}
            >
              Back to Login
            </Button>
            <CompactSignUpForm 
              onSignUpSuccess={() => {
                setShowSignUp(false)
              }} 
            />
          </div>
        ) : (
          <CompactLoginForm 
            onSuccess={handleLoginSuccess}
            onSwitchToSignUp={() => setShowSignUp(true)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
} 