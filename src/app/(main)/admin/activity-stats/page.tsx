'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ActivityStats {
  summary: {
    totalActivities: number;
    uniqueUsers: number;
    avgActivitiesPerUser: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  activityBreakdown: Array<{
    activityType: string;
    _count: { id: number };
  }>;
  topUsers: Array<{
    userId: number;
    _count: { id: number };
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  }>;
  recentActivities: Array<{
    id: string;
    activityType: string;
    entityType: string;
    entityId: string;
    timestamp: string;
    deviceType: string;
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  }>;
}

export default function ActivityStatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers();
      fetchStats();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (selectedUser) params.append('userId', selectedUser);
      if (selectedActivity) params.append('activityType', selectedActivity);

      const response = await fetch(`/api/admin/activity-stats?${params}`);
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

  const handleFilterChange = () => {
    fetchStats();
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedUser('');
    setSelectedActivity('');
    setTimeout(fetchStats, 100);
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'LOGIN': return 'bg-green-100 text-green-800';
      case 'CREATE_PROPERTY': return 'bg-blue-100 text-blue-800';
      case 'EDIT_PROPERTY': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE_PROPERTY': return 'bg-red-100 text-red-800';
      case 'CREATE_USER': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="text-gray-600">Seuls les administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Statistiques d'Activité</h1>
        <p className="text-gray-600">Suivi et analyse des activités utilisateur</p>
      </div>

      {/* Simple Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date de début</label>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date de fin</label>
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Utilisateur</label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type d'activité</label>
            <select 
              value={selectedActivity} 
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Toutes les activités</option>
              <option value="LOGIN">Connexion</option>
              <option value="CREATE_PROPERTY">Création propriété</option>
              <option value="EDIT_PROPERTY">Modification propriété</option>
              <option value="DELETE_PROPERTY">Suppression propriété</option>
              <option value="CREATE_USER">Création utilisateur</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button 
            onClick={handleFilterChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Appliquer les filtres
          </button>
          <button 
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Total des Activités</h3>
              <div className="text-3xl font-bold text-blue-600">
                {stats.summary.totalActivities.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Du {new Date(stats.summary.dateRange.start).toLocaleDateString()} au{' '}
                {new Date(stats.summary.dateRange.end).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Utilisateurs Actifs</h3>
              <div className="text-3xl font-bold text-green-600">
                {stats.summary.uniqueUsers}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Utilisateurs uniques avec activité
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Moyenne par Utilisateur</h3>
              <div className="text-3xl font-bold text-purple-600">
                {stats.summary.avgActivitiesPerUser}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Activités moyennes par utilisateur
              </p>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Répartition des Activités</h3>
            <div className="space-y-2">
              {stats.activityBreakdown.map((item, index) => (
                <div key={item.activityType} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{formatActivityType(item.activityType)}</span>
                  <span className="text-blue-600 font-bold">{item._count.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Utilisateurs les Plus Actifs</h3>
            <div className="space-y-2">
              {stats.topUsers.slice(0, 10).map((userStat, index) => (
                <div key={userStat.userId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{userStat.user.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({userStat.user.email})</span>
                  </div>
                  <span className="text-green-600 font-bold">{userStat._count.id} activités</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Activités Récentes</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Utilisateur</th>
                    <th className="px-4 py-2 text-left">Activité</th>
                    <th className="px-4 py-2 text-left">Entité</th>
                    <th className="px-4 py-2 text-left">Appareil</th>
                    <th className="px-4 py-2 text-left">Date/Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivities.slice(0, 20).map((activity) => (
                    <tr key={activity.id} className="border-b">
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-medium">{activity.user.name}</div>
                          <div className="text-sm text-gray-500">{activity.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${getActivityColor(activity.activityType)}`}>
                          {formatActivityType(activity.activityType)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-sm">{activity.entityType}</div>
                          {activity.entityId && (
                            <div className="text-xs text-gray-500">ID: {activity.entityId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {activity.deviceType || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm">
                          {new Date(activity.timestamp).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString('fr-FR')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      )}
    </div>
  );
}