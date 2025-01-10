'use client';

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CompactLoginForm } from "@/components/CompactLoginForm"
import { CompactSignUpForm } from "@/components/CompactSignUpForm"
import { RatingForm } from "@/components/RatingForm"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

interface AuthSheetProps {
  onLoginSuccess: () => void;
  trigger?: React.ReactNode;
  isLoading?: boolean;
  professorId?: string;
}

export function AuthSheet({ onLoginSuccess, trigger, isLoading, professorId }: AuthSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const { user } = useUser()

  const handleLoginSuccess = () => {
    setShowRatingForm(true)
    onLoginSuccess()
  }

  const handleSignUpSuccess = () => {
    setShowSignUp(false)
  }

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setShowSignUp(false)
      setShowRatingForm(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="outline-none focus:outline-none focus-visible:ring-0">
        {showRatingForm ? (
          <RatingForm preSelectedProfessorId={professorId} />
        ) : showSignUp ? (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="mb-2"
              onClick={() => setShowSignUp(false)}
            >
              Back to Login
            </Button>
            <CompactSignUpForm onSignUpSuccess={handleSignUpSuccess} />
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