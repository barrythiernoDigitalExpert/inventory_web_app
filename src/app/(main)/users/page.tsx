'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

// User service functions to be implemented
import {
  fetchUsers,
  createUser,
  updateUserRole,
  resetUserPassword,
  toggleUserActiveStatus,
  User
} from '@/lib/services/userService'

export default function UsersPage() {
  // State
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortOrder, setSortOrder] = useState('asc')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt'>('name')
const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')  
  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('USER')
  const [generatedPassword, setGeneratedPassword] = useState('')
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: ''
  })

  const handleToggleActiveStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true)
      const newStatus = !currentStatus
      const result = await toggleUserActiveStatus(userId, newStatus)
      
      if (result) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, isActive: newStatus } : user
          )
        )
        
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`)
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    } finally {
      setIsLoading(false)
    }
  }

  const router = useRouter()

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        const data = await fetchUsers()
        setUsers(data)
      } catch (error) {
        console.error('Error loading users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Filter and sort users
  const filteredAndSortedUsers =
  users.length > 0
    ? [...users]
        .filter(user => {
          // Filtre par statut (actif/inactif)
          if (statusFilter === 'active' && !user.isActive) return false;
          if (statusFilter === 'inactive' && user.isActive) return false;

          // Filtre par terme de recherche (sur nom ou email)
          if (searchTerm === '') return true;
          
          return user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 user.email.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
          // La logique de tri reste la même
          const getValue = (obj: User, key: typeof sortBy) => {
            if (key === 'createdAt') {
              return new Date(obj[key]);
            }
            return obj[key];
          };

          const valueA = getValue(a, sortBy);
          const valueB = getValue(b, sortBy);

          if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
          if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        })
    : [];

  // Toggle sort function
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    return password
  }

  // Handle user creation
  const handleCreateUser = async () => {
    try {
      if (!newUserName || !newUserEmail) {
        setNotification({
          show: true,
          type: 'error',
          message: 'Name and email are required'
        })
        return
      }

      setIsLoading(true)
      const password = generatedPassword || generatePassword()
      
      const userData = {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password
      }
      
      const result = await createUser(userData)
      
      if (result) {
        // Reload users
        const updatedUsers = await fetchUsers()
        setUsers(updatedUsers)
        
        setNotification({
          show: true,
          type: 'success',
          message: 'User created successfully!'
        })
        
        // Reset form
        setNewUserName('')
        setNewUserEmail('')
        setNewUserRole('USER')
        setGeneratedPassword('')
        setShowAddUserModal(false)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to create user'
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000)
    }
  }

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setIsLoading(true)
      console.log(newRole)
      const result = await updateUserRole(userId, newRole)
      
      if (result) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, role: newRole } : user
          )
        )
        
        toast.success('User role updated')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password reset
  const handlePasswordReset = async (userId: string) => {
    try {
      const newPassword = generatePassword()
      const result = await resetUserPassword(userId, newPassword)
      
      if (result) {
        toast.success('Password reset successful')
        
        // Show the new password
        setNotification({
          show: true,
          type: 'success',
          message: `New password: ${newPassword}`
        })
        
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 10000)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    }
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#D4A017]">
          <svg
            className="animate-spin h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div>
      {notification.show && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header with title and filtering options */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-6 shadow-lg mb-6 border-l-4 border-[#D4A017]">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-[#FFFFFF]">
            User Management
          </h1>
          <div className="flex space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="btn btn-primary flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add User
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-[#D4A017] text-[#1E1E1E]'
                    : 'bg-[#1E1E1E] text-[#D4A017] border border-[#D4A017]/30'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-[#D4A017] text-[#1E1E1E]'
                    : 'bg-[#1E1E1E] text-[#D4A017] border border-[#D4A017]/30'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-5 shadow-lg mb-6 border border-[#D4A017]/10">
  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-[#D4A017]"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>
      <input
        type="search"
        className="block w-full p-3 pl-10 text-sm rounded-lg bg-[#1E1E1E] border border-[#D4A017]/20 focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
    </div>
    
    {/* Status Filter Buttons */}
    <div className="flex space-x-2">
      <button
        onClick={() => setStatusFilter('all')}
        className={`px-3 py-2 rounded-md text-sm ${
          statusFilter === 'all'
            ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30'
            : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-[#D4A017]/20'
        }`}
      >
        All Users
      </button>
      <button
        onClick={() => setStatusFilter('active')}
        className={`px-3 py-2 rounded-md text-sm ${
          statusFilter === 'active'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-green-500/20'
        }`}
      >
        Active Only
      </button>
      <button
        onClick={() => setStatusFilter('inactive')}
        className={`px-3 py-2 rounded-md text-sm ${
          statusFilter === 'inactive'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-red-500/20'
        }`}
      >
        Inactive Only
      </button>
    </div>
  </div>
  
  {/* Sort buttons */}
  <div className="flex space-x-2 mt-4">
    <span className="text-sm text-[#CCCCCC] mr-2 self-center">Sort by:</span>
    <button
      onClick={() => toggleSort('name')}
      className={`px-3 py-2 rounded-md text-sm ${
        sortBy === 'name'
          ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30'
          : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-[#D4A017]/20'
      }`}
    >
      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
    </button>
    <button
      onClick={() => toggleSort('role')}
      className={`px-3 py-2 rounded-md text-sm ${
        sortBy === 'role'
          ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30'
          : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-[#D4A017]/20'
      }`}
    >
      Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
    </button>
    <button
      onClick={() => toggleSort('createdAt')}
      className={`px-3 py-2 rounded-md text-sm ${
        sortBy === 'createdAt'
          ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30'
          : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-[#D4A017]/20'
      }`}
    >
      Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
    </button>
  </div>
</div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedUsers.length > 0 ? (
            filteredAndSortedUsers.map(user => (
              <div
                key={user.id}
                className="bg-[#2D2D2D] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center mb-3">
                      <div className="h-12 w-12 rounded-full bg-[#D4A017] text-[#1E1E1E] flex items-center justify-center text-xl font-bold mr-3">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#FFFFFF]">
                          {user.name}
                        </h3>
                        <p className="text-sm text-[#CCCCCC]">
                          {user.email}
                        </p>
                        <div className="mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <span className="text-[#D4A017] text-sm font-medium mr-2">Role:</span>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className="bg-[#1E1E1E] text-white border border-[#3D3D3D] rounded px-2 py-1 text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#1E1E1E] rounded-lg p-2 text-center">
                      <span className="text-xs text-[#CCCCCC]">Properties</span>
                      <div className="text-[#D4A017] font-bold">{user.propertiesCount || 0}</div>
                    </div>
                    <div className="bg-[#1E1E1E] rounded-lg p-2 text-center">
                      <span className="text-xs text-[#CCCCCC]">Shared</span>
                      <div className="text-[#D4A017] font-bold">{user.sharedCount || 0}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-[#CCCCCC]">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                     <button
              onClick={() => handleToggleActiveStatus(user.id, user.isActive)}
              className={`${user.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} transition-colors`}
              title={user.isActive ? 'Deactivate User' : 'Activate User'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={user.isActive 
                    ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
                    : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
                />
              </svg>
            </button>
                    <button
                      onClick={() => handlePasswordReset(user.id)}
                      className="text-[#D4A017] hover:text-[#E6B52C] transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-64 bg-[#2D2D2D] rounded-lg">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-[#CCCCCC] mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-[#CCCCCC]">
                  No users match your search criteria.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-[#2D2D2D] rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#1E1E1E]">
              <thead className="bg-[#1E1E1E]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider"
    >
      Status
    </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider"
                  >
                    Properties
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider"
                  >
                    Created Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-[#CCCCCC] uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E]">
                {filteredAndSortedUsers.length > 0 ? (
                  filteredAndSortedUsers.map(user => (
                    <tr
                      key={user.id}
                      className="hover:bg-[#1E1E1E]/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#D4A017] text-[#1E1E1E] flex items-center justify-center text-xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#FFFFFF]">
                              {user.name}
                            </div>
                            <div className="text-xs text-[#CCCCCC]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className="bg-[#1E1E1E] text-white border border-[#3D3D3D] rounded px-2 py-1 text-sm"
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        user.isActive 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-red-500/20 text-red-400'
      }`}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 text-xs font-medium bg-[#D4A017]/20 text-[#D4A017] rounded-full">
                            {user.propertiesCount || 0} owned
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                            {user.sharedCount || 0} shared
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CCCCCC]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                            <button
          onClick={() => handleToggleActiveStatus(user.id, user.isActive)}
          className={`${user.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} transition-colors`}
          title={user.isActive ? 'Deactivate User' : 'Activate User'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d={user.isActive 
                ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
                : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
            />
          </svg>
        </button>
                          <button
                            onClick={() => handlePasswordReset(user.id)}
                            className="text-[#CCCCCC] hover:text-[#D4A017] transition-colors"
                            title="Reset Password"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-[#CCCCCC]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto mb-3 text-[#CCCCCC]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      No users match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] rounded-lg max-w-md w-full">
            {/* Modal header */}
            <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#FFFFFF]">Add New User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
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

            {/* Modal content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-[#FFFFFF] mb-2 font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full p-2 rounded-md bg-[#2D2D2D] border border-[#3D3D3D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#FFFFFF] mb-2 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full p-2 rounded-md bg-[#2D2D2D] border border-[#3D3D3D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#FFFFFF] mb-2 font-medium">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full p-2 rounded-md bg-[#2D2D2D] border border-[#3D3D3D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-[#FFFFFF] mb-2 font-medium">
                  Password
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="w-full p-2 rounded-l-md bg-[#2D2D2D] border border-[#3D3D3D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                    placeholder="Generated password will appear here"
                  />
                  <button
                    onClick={generatePassword}
                    className="px-3 py-2 rounded-r-md bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-[#CCCCCC] mt-1">
                  A secure password will be generated for the user.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#1E1E1E]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={!newUserName || !newUserEmail || !generatedPassword}
                  className={`px-4 py-2 rounded-md ${
                    !newUserName || !newUserEmail || !generatedPassword
                      ? 'bg-[#2D2D2D] text-[#CCCCCC] cursor-not-allowed'
                      : 'bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]'
                  }`}
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}