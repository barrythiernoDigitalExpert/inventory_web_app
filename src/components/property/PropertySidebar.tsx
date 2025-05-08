// src/components/property/PropertySidebar.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Property } from '@/lib/services/propertyService';
import PropertyShareComponent from '@/components/property/PropertyShare';
import { getPropertyShares, PropertyShare } from '@/lib/services/propertyService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PropertySidebarProps {
  property: Property;
  currentUser?: any; 
}

const PropertySidebar: React.FC<PropertySidebarProps> = ({ property, currentUser }) => {
  const [shares, setShares] = useState<PropertyShare[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if user can see share button (admin or creator)
  const canShareProperty = 
    currentUser?.role === 'ADMIN' || 
    property.owner?.email === currentUser?.email; // Fixed: comparing email with email
   
  
  useEffect(() => {
    const loadShares = async () => {
      setLoading(true);
      try {
        const sharesData = await getPropertyShares(property.id.toString());
        setShares(sharesData);
      } catch (error) {
        console.error('Error loading shares:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadShares();
  }, [property.id]);

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
          
          {/* Shared with section */}
          <div>
            <p className="text-[#CCCCCC] text-sm">Shared With</p>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : shares.length > 0 ? (
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {shares.map(share => (
                  <div key={share.id} className="bg-[#2D2D2D] rounded p-2">
                    <p className="text-[#FFFFFF] text-sm">{share.user.name}</p>
                    <div className="flex space-x-2 mt-1">
                      {share.canEdit && (
                        <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-500 rounded-full">
                          Edit
                        </span>
                      )}
                      {share.canDelete && (
                        <span className="px-2 py-0.5 text-xs bg-red-600/20 text-red-500 rounded-full">
                          Delete
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#FFFFFF] text-sm">Not shared with anyone</p>
            )}
          </div>
        </div>
        
        {/* Only show share button for admin or creator */}
        {canShareProperty ? (
          <PropertyShareComponent propertyId={property.id.toString()} />
        ) : null}
        
      </div>
    </div>
  );
};

export default PropertySidebar;