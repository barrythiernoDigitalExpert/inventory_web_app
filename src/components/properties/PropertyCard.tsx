// src/components/properties/PropertyCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/lib/services/propertyService';

interface PropertyCardProps {
  property: Property;
  onGeneratePDF: () => void;
}

export const PropertyCard = ({ property, onGeneratePDF }: PropertyCardProps) => {
  return (
    <div className="bg-[#2D2D2D] rounded-lg overflow-hidden shadow-lg">
      <div className="relative h-48 w-full">
        <Image
          src={property.image}
          alt={property.name}
          fill
          style={{ objectFit: 'cover' }}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
        />
      </div>
      <div className="p-4">
        <div className="text-xs text-[#CCCCCC] mb-1">{property.reference}</div>
        <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">{property.name}</h3>
        <p className="text-sm text-[#CCCCCC] mb-3">{property.address}</p>
        <div className="text-xs text-[#CCCCCC] mb-4">
          Créée le: {property.createdAt}
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/properties/${property.id}`}
            className="flex-1 p-2 text-center rounded-md bg-[#1E1E1E] text-[#FFFFFF] hover:bg-[#333333] transition-colors text-sm"
          >
            Voir
          </Link>
          <button 
            onClick={onGeneratePDF}
            className="flex-1 p-2 text-center rounded-md bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13] transition-colors text-sm"
          >
            Générer PDF
          </button>
        </div>
      </div>
    </div>
  );
};