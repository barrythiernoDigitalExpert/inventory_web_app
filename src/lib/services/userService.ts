// src/lib/services/userService.ts
import { toast } from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  propertiesCount?: number;
  sharedCount?: number;
}

/**
 * Fetches all users with their stats
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const data = await response.json();
    console.log("afficher touts les users"+data.users)
    return data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
    return [];
  }
}

/**
 * Creates a new user
 */
export async function createUser(userData: {
  name: string;
  email: string;
  role: string;
  password: string;
}): Promise<User | null> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create user');
    }

    const data = await response.json();
    toast.success('User created successfully');
    return data.user;
  } catch (error) {
    console.error('Error creating user:', error);
    toast.error('Failed to create user');
    return null;
  }
}

/**
 * Updates a user's role
 */
export async function updateUserRole(userId: string, role: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user role');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error updating user role:', error);
    toast.error('Failed to update user role');
    return null;
  }
}

/**
 * Toggles a user's active status
 */
export async function toggleUserActiveStatus(userId: string, isActive: boolean): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user status');
    }

    const data = await response.json();
    toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    return data.user;
  } catch (error) {
    console.error('Error updating user status:', error);
    toast.error('Failed to update user status');
    return null;
  }
}


/**
 * Resets a user's password
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reset password');
    }

    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    toast.error('Failed to reset password');
    return false;
  }
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
  try {
    // Make sure the search term is properly encoded
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    
    // Update the path to match the App Router format
    const response = await fetch(`/api/users/search?q=${encodedSearchTerm}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for improved performance
      cache: 'no-store' // Prevent caching to always get fresh results
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to search users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}