import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import PixRequirementModal from '../components/PixRequirementModal';
import { useAuth } from '../context/AuthContext';
import partnerService from '../services/partnerService';

const DashboardLayout = () => {
  const { user } = useAuth();
  const role = user?.role || 'partner';
  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    // Only check for partners
    if (role === 'partner') {
        checkPixStatus();
    }
  }, [role]);

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
