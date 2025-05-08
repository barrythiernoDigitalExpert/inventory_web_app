import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Services
import { searchUsers, User } from '@/lib/services/userService';
import { sharePropertyWithUser, removePropertyShare, getPropertyShares, PropertyShare } from '@/lib/services/propertyService';

interface PropertyShareProps {
  propertyId: string;
}

const PropertyShareComponent: React.FC<PropertyShareProps> = ({ propertyId }) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentShares, setCurrentShares] = useState<PropertyShare[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  // Load existing shares when the component mounts
  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [propertyId, isOpen]);

  // Search for users when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const shares = await getPropertyShares(propertyId);
      console.log(shares);
      setCurrentShares(shares);
    } catch (error) {
      console.error('Error loading property shares:', error);
      toast.error('Failed to load shared users');
    } finally {
      setLoadingShares(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setIsLoading(true);
    try {
      const users = await searchUsers(searchTerm);
      // Filter out users that already have access
      const filteredUsers = users.filter(user => 
        !currentShares.some(share => share.user.id === user.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleShare = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      await sharePropertyWithUser(propertyId, selectedUser.id, {
        canEdit,
        canDelete
      });
      
      toast.success(`Property shared with ${selectedUser.name}`);
      setSelectedUser(null);
      setCanEdit(false);
      setCanDelete(false);
      
      // Reload the shares
      await loadShares();
    } catch (error) {
      console.error('Error sharing property:', error);
      toast.error('Failed to share property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    setLoadingShares(true);
    try {
      await removePropertyShare(propertyId, shareId);
      toast.success('Access removed');
      
      // Update local state
      setCurrentShares(prev => prev.filter(share => share.id !== shareId));
    } catch (error) {
      console.error('Error removing share:', error);
      toast.error('Failed to remove access');
    } finally {
      setLoadingShares(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 w-full py-2 px-4 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#D4A017] rounded-md flex items-center justify-center transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Share Property
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-lg w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#FFFFFF]">Share Property</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#CCCCCC] hover:text-[#FFFFFF]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Current shared users section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#D4A017] mb-2">
                  Currently Shared With
                </h4>
                
                {loadingShares ? (
                  <LoadingSpinner size="sm" />
                ) : currentShares.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentShares.map(share => (
                      <div
                        key={share.id}
                        className="bg-[#2D2D2D] rounded p-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-[#FFFFFF]">{share.user.name}</p>
                          <p className="text-xs text-[#CCCCCC]">{share.user.email}</p>
                          <div className="flex space-x-2 mt-1">
                            {share.canEdit && (
                              <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-500 rounded-full">
                                Can Edit
                              </span>
                            )}
                            {share.canDelete && (
                              <span className="px-2 py-0.5 text-xs bg-red-600/20 text-red-500 rounded-full">
                                Can Delete
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveShare(share.id)}
                          className="p-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
                          title="Remove access"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#CCCCCC]">
                    This property is not shared with anyone yet.
                  </p>
                )}
              </div>

              {/* Add new share section */}
              <div>
                <h4 className="text-sm font-medium text-[#D4A017] mb-2">
                  Add New User
                </h4>

                {selectedUser ? (
                  <div className="bg-[#2D2D2D] rounded p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[#FFFFFF]">{selectedUser.name}</p>
                        <p className="text-xs text-[#CCCCCC]">{selectedUser.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="text-[#CCCCCC] hover:text-[#FFFFFF]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="canEdit"
                          checked={canEdit}
                          onChange={() => setCanEdit(!canEdit)}
                          className="rounded border-[#D4A017] text-[#D4A017] focus:ring-[#D4A017]"
                        />
                        <label
                          htmlFor="canEdit"
                          className="ml-2 text-sm text-[#FFFFFF]"
                        >
                          Can edit property
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="canDelete"
                          checked={canDelete}
                          onChange={() => setCanDelete(!canDelete)}
                          className="rounded border-[#D4A017] text-[#D4A017] focus:ring-[#D4A017]"
                        />
                        <label
                          htmlFor="canDelete"
                          className="ml-2 text-sm text-[#FFFFFF]"
                        >
                          Can delete images
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-md bg-[#2D2D2D] border border-[#3D3D3D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-4 w-4 text-[#D4A017]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center mt-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            className="p-2 hover:bg-[#2D2D2D] rounded cursor-pointer transition-colors"
                            onClick={() => handleSelectUser(user)}
                          >
                            <p className="text-[#FFFFFF]">{user.name}</p>
                            <p className="text-xs text-[#CCCCCC]">{user.email}</p>
                          </div>
                        ))}
                      </div>
                    ) : searchTerm.length >= 2 ? (
                      <p className="text-sm text-[#CCCCCC] mt-2">
                        No users found matching your search.
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end mt-6 space-x-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#FFFFFF] hover:bg-[#3D3D3D] transition-colors"
                  >
                    Cancel
                  </button>
                  {selectedUser && (
                    <button
                      onClick={handleShare}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-md bg-[#D4A017] text-black hover:bg-[#E6B52C] transition-colors flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Sharing...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            />
                          </svg>
                          Share
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyShareComponent;