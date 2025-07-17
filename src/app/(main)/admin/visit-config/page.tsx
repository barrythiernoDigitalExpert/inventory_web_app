'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface VisitConfiguration {
  id: number;
  revisitDelayHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function VisitConfigPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<VisitConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revisitDelayHours, setRevisitDelayHours] = useState<number>(168);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchConfiguration();
    }
  }, [session]);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/visit-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data.configuration);
        setRevisitDelayHours(data.data.configuration.revisitDelayHours);
      } else {
        console.error('Failed to fetch visit configuration');
        setMessage({ type: 'error', text: 'Failed to load visit configuration' });
      }
    } catch (error) {
      console.error('Error fetching visit configuration:', error);
      setMessage({ type: 'error', text: 'Error loading visit configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/visit-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revisitDelayHours: revisitDelayHours
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setConfig(data.data.configuration);
        setMessage({ type: 'success', text: data.message || 'Configuration updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update configuration' });
      }
    } catch (error) {
      console.error('Error updating visit configuration:', error);
      setMessage({ type: 'error', text: 'Error updating configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevisitDelayChange = (value: number) => {
    if (value >= 1 && value <= 8760) { // 1 hour to 1 year
      setRevisitDelayHours(value);
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours < 168) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}`;
    } else {
      const weeks = Math.floor(hours / 168);
      const remainingDays = Math.floor((hours % 168) / 24);
      return `${weeks} week${weeks !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
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
        <h1 className="text-3xl font-bold mb-2">Visit Configuration</h1>
        <p className="text-gray-600">Configure canvassing visit settings and revisit policies</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-black">Revisit Policy Settings</h2>
          
          <div className="space-y-6">
            {/* Current Configuration Display */}
            {config && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Current Active Configuration</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Revisit Delay:</strong> {formatDuration(config.revisitDelayHours)}</p>
                  <p><strong>Last Updated:</strong> {new Date(config.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Revisit Delay Configuration */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Revisit Delay (Hours)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  max="8760"
                  value={revisitDelayHours}
                  onChange={(e) => handleRevisitDelayChange(parseInt(e.target.value) || 1)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <span className="text-sm text-black">
                  = {formatDuration(revisitDelayHours)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">
                Set the minimum time (in hours) that must pass before a location can be visited again. 
                Valid range: 1 hour to 8760 hours (1 year).
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRevisitDelayHours(24)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-black"
                >
                  1 Day
                </button>
                <button
                  onClick={() => setRevisitDelayHours(72)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-black"
                >
                  3 Days
                </button>
                <button
                  onClick={() => setRevisitDelayHours(168)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-black"
                >
                  1 Week
                </button>
                <button
                  onClick={() => setRevisitDelayHours(336)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-black"
                >
                  2 Weeks
                </button>
                <button
                  onClick={() => setRevisitDelayHours(720)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-black"
                >
                  1 Month
                </button>
                <button
                  onClick={() => setRevisitDelayHours(2160)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-black"
                >
                  3 Months
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How Revisit Policy Works</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Mobile users will see visit eligibility status when pulling visit data</li>
                <li>• Locations show "Can Revisit" status based on the configured delay</li>
                <li>• This helps prevent over-visiting the same locations too frequently</li>
                <li>• The policy applies to all users and all contact methods</li>
              </ul>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !config || revisitDelayHours === config.revisitDelayHours}
                className={`px-6 py-2 rounded-md font-medium ${
                  saving || !config || revisitDelayHours === config.revisitDelayHours
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}