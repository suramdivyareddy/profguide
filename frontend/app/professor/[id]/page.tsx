'use client';

import { useEffect, useState } from 'react';
import { ProfessorProfile } from '@/components/ProfessorProfile';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProfessorPage({params}: PageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const profId = params.id;

  useEffect(() => {
    const initPage = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoaded(true);
    };

    initPage();
  }, [profId]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <ProfessorProfile professorId={profId} />
    </div>
  );
}
