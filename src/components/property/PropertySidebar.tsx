// src/components/property/PropertySidebar.tsx
import React from 'react';
import Image from 'next/image';
import { Property } from '@/lib/services/propertyService';

interface PropertySidebarProps {
  property: Property;
}

const PropertySidebar: React.FC<PropertySidebarProps> = ({ property }) => {
  return (
    <div className="lg:col-span-1 card-gold hover-golden">
      <div className="relative h-48 w-full">
        <Image
          src={property.image || '/images/property-placeholder.jpg'}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          style={{ objectFit: 'cover' }}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
        />
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <p className="text-[#CCCCCC] text-sm">Reference Number</p>
            <p className="text-[#FFFFFF] font-medium">{property.reference}</p>
          </div>
          <div>
            <p className="text-[#CCCCCC] text-sm">Property Address</p>
            <p className="text-[#FFFFFF] font-medium">{property.address || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-[#CCCCCC] text-sm">Date of Inventory</p>
            <p className="text-[#FFFFFF] font-medium">
              {new Date(property.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-[#CCCCCC] text-sm">Name Listing Person</p>
            <p className="text-[#FFFFFF] font-medium">
              {property.listingPerson || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-[#CCCCCC] text-sm">Owner</p>
            <p className="text-[#FFFFFF] font-medium">
              {property.owner?.name || 'Not specified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySidebar;