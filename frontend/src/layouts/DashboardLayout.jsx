import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import PixRequirementModal from '../components/PixRequirementModal';
import { useAuth } from '../context/AuthContext';
import partnerService from '../services/partnerService';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const DashboardLayout = () => {
  const { user, setUnreadMessages } = useAuth();
  const role = user?.role || 'partner';
  const [showPixModal, setShowPixModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only check for partners
    if (role === 'partner') {
        checkPixStatus();
    }
  }, [role]);

  // Global Socket Listener for Notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io('https://others-tirvu-parceiros-frontend.pvuzyy.easypanel.host' || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('receive_message', (message) => {
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));

        // Show Toast
        toast((t) => (
            <div className="flex items-start gap-3" onClick={() => {
                toast.dismiss(t.id);
                // Optional: navigate to chat
            }}>
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                    {message.Sender?.name?.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-sm">{message.Sender?.name}</p>
                    <p className="text-sm text-gray-600 truncate max-w-[200px]">{message.content}</p>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-right',
            style: {
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '12px',
                borderRadius: '12px'
            }
        });

        // Increment unread count in context if not on chat page
        if (!location.pathname.includes('/chat')) {
            setUnreadMessages(prev => prev + 1);
        }
    });

    return () => socket.disconnect();
  }, [setUnreadMessages, location.pathname]);

  const checkPixStatus = async () => {
    try {
        const profile = await partnerService.getProfile();
        if (!profile.pixKey) {
            setShowPixModal(true);
        }
    } catch (error) {
        console.error('Error checking pix status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={role} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <BottomNav role={role} />

      {/* Mandatory Pix Modal */}
      {role === 'partner' && (
        <PixRequirementModal 
            isOpen={showPixModal} 
            onClose={() => setShowPixModal(false)} 
        />
      )}
    </div>
  );
};

export default DashboardLayout;
