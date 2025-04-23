// src/app/(main)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardData, fetchDashboardData } from '@/lib/services/propertyService';

export default function Dashboard() {
  //const [data, setData] = useState(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#D4A017]">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

<div className="bg-gradient-to-r from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-6 shadow-lg border-l-4 border-[#D4A017]">
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-[#FFFFFF]">Dashboard</h1>
      <p className="text-[#D4A017] mt-2 font-light">
        Welcome to your inventory management system
      </p>
    </div>
    <div className="text-right">
      <div className="text-[#D4A017] text-lg font-semibold">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  </div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-[#D4A017]/20">
    <div className="flex items-center">
      <div className="rounded-full bg-[#D4A017]/20 p-3 mr-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2" />
        </svg>
      </div>
      <div>
        <div className="text-sm text-[#D4A017]">Total Properties</div>
        <div className="text-2xl font-bold text-[#FFFFFF]">{data?.stats.totalProperties || 0}</div>
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-[#D4A017]/20">
    <div className="flex items-center">
      <div className="rounded-full bg-[#D4A017]/20 p-3 mr-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <div className="text-sm text-[#D4A017]">Recently Updated</div>
        <div className="text-2xl font-bold text-[#FFFFFF]">{data?.stats.recentlyUpdated || 0}</div>
      </div>
    </div>
  </div>
</div>

      {/* Recent Properties with improved design */}
<div className="bg-gradient-to-br from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-6 shadow-lg border border-[#D4A017]/20">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold text-[#FFFFFF]">Recent Properties</h2>
    <Link href="/properties" className="text-[#D4A017] hover:text-[#E6B52C] flex items-center">
      <span>View all properties</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </Link>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {data?.recentProperties?.slice(0, 12).map((property) => (
      <Link key={property.id} href={`/properties/${property.id}`} className="block">
        <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow group border border-transparent hover:border-[#D4A017]/30">
          <div className="relative h-36 w-full">
            <Image
              src={property.image || '/images/property-placeholder.jpg'}
              alt={property.reference}
              fill
              style={{ objectFit: 'cover' }}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>
            <div className="absolute bottom-0 left-0 p-2 text-white">
              <div className="text-xs text-[#D4A017]">{property.reference}</div>
              <div className="font-semibold truncate">{property.name}</div>
            </div>
          </div>
        </div>
      </Link>
    ))}
  </div>
</div>
    </div>
  );
}