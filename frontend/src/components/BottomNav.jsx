import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = ({ role }) => {
  const { logout } = useAuth();

  const partnerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dash' },
    { to: '/dashboard/leads', icon: Users, label: 'Leads' },
    { to: '/dashboard/transactions', icon: Wallet, label: '$$$' },
    { to: '/dashboard/materials', icon: FileText, label: 'Docs' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dash' },
    { to: '/admin/partners', icon: Users, label: 'Prcs' },
    { to: '/admin/leads', icon: FileText, label: 'Leads' },
    { to: '/admin/transactions', icon: Wallet, label: '$$$' },
  ];

  const links = role === 'admin' ? adminLinks : partnerLinks;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="h-6 w-6 mb-1" />
            {link.label}
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-full h-full text-xs font-medium text-red-500 hover:text-red-700"
        >
          <LogOut className="h-6 w-6 mb-1" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
