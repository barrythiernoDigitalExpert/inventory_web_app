'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  properties: {
    total: number;
    completed: number;
    draft: number;
  };
  visits: {
    total: number;
    thisWeek: number;
    positive: number;
    negative: number;
  };
  images: {
    total: number;
    thisWeek: number;
  };
}

export default function AdminStatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of system statistics and performance</p>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/admin/activity-stats" 
            className="p-3 bg-blue-50 hover:bg-blue-100 rounded border text-center transition-colors"
          >
            <div className="font-medium text-black">Activity Statistics</div>
            <div className="text-sm text-gray-700">User activity tracking and analytics</div>
          </Link>
          <Link 
            href="/admin/visit-config" 
            className="p-3 bg-green-50 hover:bg-green-100 rounded border text-center transition-colors"
          >
            <div className="font-medium text-black">Visit Configuration</div>
            <div className="text-sm text-gray-700">Configure canvassing visit settings</div>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Users Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.users.total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.users.active}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">{stats.users.admins}</div>
                <div className="text-sm text-gray-600">Administrators</div>
              </div>
            </div>
          </div>

          {/* Properties Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.properties.total}</div>
                <div className="text-sm text-gray-600">Total Properties</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.properties.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">{stats.properties.draft}</div>
                <div className="text-sm text-gray-600">Draft</div>
              </div>
            </div>
          </div>

          {/* Visits Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Canvassing Visits</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.visits.total}</div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded">
                <div className="text-2xl font-bold text-indigo-600">{stats.visits.thisWeek}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.visits.positive}</div>
                <div className="text-sm text-gray-600">Positive Responses</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{stats.visits.negative}</div>
                <div className="text-sm text-gray-600">Negative Responses</div>
              </div>
            </div>
          </div>

          {/* Images Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.images.total}</div>
                <div className="text-sm text-gray-600">Total Images</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.images.thisWeek}</div>
                <div className="text-sm text-gray-600">Added This Week</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={fetchStats}
                className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh Statistics
              </button>
              <Link
                href="/properties"
                className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center"
              >
                View All Properties
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No statistics available</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}