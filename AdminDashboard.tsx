import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  LogOut, 
  Shield, 
  Database, 
  Settings, 
  Bell,
  Trash2,
  Ban,
  CheckCircle,
  LayoutDashboard
} from "lucide-react";
import { getStoredUsers, UserData, toggleUserStatus, deleteUser } from "./services/auth";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getStoredUsers());
  };

  const handleToggleStatus = (username: string) => {
    const updatedUsers = toggleUserStatus(username);
    setUsers(updatedUsers);
  };

  const handleDeleteUser = (username: string) => {
    if (window.confirm(`Are you sure you want to delete user ${username}? This action is irreversible.`)) {
      const updatedUsers = deleteUser(username);
      setUsers(updatedUsers);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate storage usage
  const calculateStorage = () => {
    const json = JSON.stringify(users);
    const bytes = new TextEncoder().encode(json).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Admin Panel</h1>
            <span className="text-xs text-indigo-400 font-medium">NanoGen Secure</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-slate-200">
            {activeTab === 'dashboard' ? 'Overview' : activeTab === 'users' ? 'User Management' : 'Settings'}
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-8">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Users</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{users.length}</h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Suspended</p>
                      <h3 className="text-3xl font-bold text-white mt-1">
                        {users.filter(u => u.status === 'suspended').length}
                      </h3>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                      <Ban className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Storage Usage</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{calculateStorage()}</h3>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                      <Database className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users View */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <Search className="w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-200 w-full placeholder:text-slate-600"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-6 py-5 font-semibold">User</th>
                        <th className="px-6 py-5 font-semibold">Status</th>
                        <th className="px-6 py-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredUsers.map((user, i) => (
                        <tr key={i} className={`hover:bg-slate-800/30 transition-colors ${user.status === 'suspended' ? 'bg-red-900/10' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-200">{user.username}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                  Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                  Suspended
                                </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleToggleStatus(user.username)}
                                  className={`p-2 rounded-lg border transition-colors ${user.status === 'active' ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                                >
                                  {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.username)}
                                  className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings Placeholder */}
          {activeTab === 'settings' && (
             <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
               <Settings className="w-16 h-16 mb-4 opacity-20" />
               <h3 className="text-xl font-medium text-slate-300">System Configuration</h3>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};
