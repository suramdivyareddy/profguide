'use client';

import { useState, KeyboardEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from 'lucide-react';
import { RatingForm } from "@/components/RatingForm";
import { AuthRequiredAction } from "@/components/AuthRequiredAction";
import { config } from '@/lib/config';
import dynamic from 'next/dynamic';
import styles from './ProfessorSearch.module.css';
import Image from 'next/image';

// Preload the loading spinner component
const LoadingSpinner = dynamic(() => import('@/components/ui/loading-spinner').then(mod => mod.LoadingSpinner), {
  ssr: false,
  loading: () => <Loader2 className="h-8 w-8 animate-spin" />
});

interface Professor {
  id: string;
  name: string;
  department: string;
  university: string;
  averageRating: number;
  numberOfRatings: number;
}

export function ProfessorSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [offsets, setOffsets] = useState<{ [key: string]: string }>({});

  // Single useEffect for position generation
  useEffect(() => {
    const startX = Math.floor(Math.random() * 10);
    const startY = Math.floor(Math.random() * 5);
    
    const offsetObj: { [key: string]: string } = {};
    let validImageCount = 0;
    
    // Create a repeating diagonal pattern with 3 images per row
    Array.from({ length: 40 }, (_, i) => {
      const row = Math.floor(i / 3);  // 3 images per row
      const col = i % 3;
      
      // Add offset for odd rows
      const rowOffset = row % 2 === 1 ? 16.66 : 0;  // 1/6 of total width for offset
      
      // Calculate positions that will repeat
      const xPos = (startX + (col * 33.33) + rowOffset);  // 33.33% spacing horizontally (100/3)
      const yPos = (startY + (row * 16));  // 40% spacing vertically
      
      offsetObj[`--offset-${validImageCount * 2 + 1}`] = `${xPos}%`;
      offsetObj[`--offset-${validImageCount * 2 + 2}`] = `${yPos}%`;
      validImageCount++;
    });

    setOffsets(offsetObj);
    setIsClient(true);
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setProfessors([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/professors?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setProfessors(data);
    } catch (error) {
      console.error('Error fetching professors:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const handleProfessorClick = (professorId: string) => {
    router.push(`/professor/${professorId}`);
  };

  return (
    <div className={styles.searchContainer}>
      <div 
        className={styles.bannerBackground}
        style={isClient ? offsets as React.CSSProperties : undefined}
      >
        <div className={styles.whiteOverlay} />
        
        <div className={styles.contentContainer}>
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Image 
                  src="/bull.svg"
                  alt="Bull Icon"
                  width={80}
                  height={64}
                  className="mr-3"
                />
                <h1 className="text-[#006747] text-5xl font-sports-world tracking-wider">ProfGuide</h1>
              </div>
            </div>

            <p className="text-center text-lg text-gray-500 mb-4">Search for professors, departments, or courses at USF</p>

            <div className="flex space-x-2">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-grow bg-white"
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                Search
              </Button>
            </div>

            <div className="mt-8">
              {isSearching ? (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <ul className="space-y-2">
                  {professors.map((professor) => (
                    <li 
                      key={professor.id} 
                      className="flex items-center justify-between bg-white rounded-md overflow-hidden"
                    >
                      <div 
                        className="flex-grow cursor-pointer hover:bg-[#F5F5F5] transition-colors duration-200 p-1 flex justify-between items-center"
                        onClick={() => handleProfessorClick(professor.id)}
                      >
                        <div>
                          <span className="font-medium">{professor.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{professor.department}, {professor.university}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {professor.numberOfRatings > 0
                            ? `${professor.averageRating.toFixed(1)} (${professor.numberOfRatings} rating${professor.numberOfRatings !== 1 ? 's' : ''})` 
                            : 'No ratings yet'}
                        </span>
                      </div>
                      <AuthRequiredAction
                        trigger={
                          <Button size="sm" className="ml-2 focus:outline-none focus-visible:ring-0">
                            <Plus className="h-4 w-4" />
                            <span className="ml-1">Add Rating</span>
                          </Button>
                        }
                      >
                        <RatingForm preSelectedProfessorId={professor.id} />
                      </AuthRequiredAction>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
