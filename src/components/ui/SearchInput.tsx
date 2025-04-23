// src/components/ui/SearchInput.tsx
import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({ value, onChange, placeholder, className = '' }: SearchInputProps) => {
  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-[#CCCCCC]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="search" 
          className="block w-full p-4 pl-10 text-sm rounded-lg bg-[#2D2D2D] border-[#1E1E1E] border focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]" 
          placeholder={placeholder} 
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};