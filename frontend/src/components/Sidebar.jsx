import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Wallet, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role }) => {
  const { logout, user } = useAuth();

  const partnerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/leads', icon: Users, label: 'Leads' },
    { to: '/dashboard/profile', icon: User, label: 'Meu Perfil' },
    { to: '/dashboard/transactions', icon: Wallet, label: 'Movimentações' },
    { to: '/dashboard/materials', icon: FileText, label: 'Materiais' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ...(role === 'admin' ? [
      { to: '/admin/users', icon: Shield, label: 'Usuários' },
      { to: '/admin/partners', icon: Users, label: 'Parceiros' }
    ] : []),
    { to: '/admin/leads', icon: FileText, label: 'Leads' },
    { to: '/admin/transactions', icon: Wallet, label: 'Movimentações' },
    { to: '/admin/materials', icon: FileText, label: 'Materiais' },
  ];

  const links = (role === 'admin' || role === 'consultor') ? adminLinks : partnerLinks;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <img src="/logo.webp" alt="Tirvu" className="h-8" />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/dashboard' || link.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 truncate w-40">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
