import { ProfessorSearch } from '@/components/ProfessorSearch'
import { UnderratedProfessors } from '@/components/UnderratedProfessors'
import { TopRatedCourses } from '@/components/TopRatedCourses'
import { ReviewStats } from '@/components/ReviewStats'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ProfGuide | Home',
  description: 'Find and rate professors at your university',
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 mt-4">
        <UnderratedProfessors />
      </div>
      <div>
        <ProfessorSearch />
      </div>
      <div className="container max-w-7xl mx-auto px-4 mt-8 flex gap-6 items-stretch">
        <div className="flex-1">
          <TopRatedCourses />
        </div>
        <div className="w-[400px]">
          <ReviewStats />
        </div>
      </div>
    </div>
  )
}
