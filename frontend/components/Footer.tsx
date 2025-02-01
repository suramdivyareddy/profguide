'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-[#006747] text-white p-4 mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <a href="https://www.usf.edu" className="hover:opacity-90">
            <Image 
              src="/bull-usf.svg"
              alt="University of South Florida"
              width={120}
              height={60}
              className="fill-white"
            />
          </a>
        </div>

        <div className="text-center md:text-left mb-4 md:mb-0">
          <p>4202 E. Fowler Avenue<br />Tampa, FL 33620, USA<br />813-974-2011</p>
        </div>

        <div className="text-center md:text-right text-sm">
          <p>Copyright © 2024<br />All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 