'use client';

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/LoginForm"
import { SignUpForm } from "@/components/SignUpForm"
import Image from 'next/image'
import { Suspense } from 'react'
export default function AuthPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login' || tab === 'signup') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSignUpSuccess = () => {
    setActiveTab("login")
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="container mx-auto mt-10 max-w-md">
      <div className="flex items-center justify-center mb-8">
        <Image 
          src="/bull.svg"
          alt="Bull Icon"
          width={60}
          height={48}
          className="mr-3"
        />
        <h1 className="text-[#006747] text-4xl font-sports-world tracking-wider">ProfGuide</h1>
      </div>

      <div className="bg-white/98 p-6 rounded-lg shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-0">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-0">
            <SignUpForm onSignUpSuccess={handleSignUpSuccess} />
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </Suspense>
  )
}