import React from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
// import { useLicenseStore } from '../../store'; // Commenting out real store hook for now

export default function ExpiryBanner() {
  // Mock License Store data for Phase 5 testing
  const mockLicenseData = {
    planType: 'Professional',
    daysRemaining: 14,
    status: 'ACTIVE' // EXPIRED, ACTIVE, GRACE
  };

  const { daysRemaining, status } = mockLicenseData;

  if (daysRemaining > 30 && status === 'ACTIVE') {
    return null; // Don't show anything if more than 30 days left
  }

  let bannerConfig = {
    color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    icon: <Clock size={18} className="text-yellow-500" />,
    message: `Your VaahanBooks license will expire in ${daysRemaining} days.`,
    buttonClass: 'bg-yellow-500 text-yellow-950 hover:bg-yellow-400'
  };

  if (status === 'EXPIRED' || daysRemaining <= 0) {
    bannerConfig = {
      color: 'bg-red-500/10 border-red-500/20 text-red-500',
      icon: <AlertCircle size={18} className="text-red-500" />,
      message: `Your License has EXPERIED! Systems are in Read-Only Mode. Renew immediately.`,
      buttonClass: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
    };
  } else if (daysRemaining <= 7) {
    bannerConfig = {
      color: 'bg-red-400/10 border-red-400/20 text-red-400',
      icon: <AlertCircle size={18} className="text-red-400" />,
      message: `CRITICAL: Your license expires in ${daysRemaining} days!`,
      buttonClass: 'bg-red-400 text-white hover:bg-red-500 shadow-md shadow-red-400/20'
    };
  } else if (daysRemaining <= 15) {
    bannerConfig = {
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      icon: <Clock size={18} className="text-orange-400" />,
      message: `Your VaahanBooks license expires in ${daysRemaining} days. Kindly Renew.`,
      buttonClass: 'bg-orange-500 text-white hover:bg-orange-400'
    };
  }

  return (
    <div className={`p-3 border-b flex justify-center items-center gap-6 animate-fade-in ${bannerConfig.color}`}>
       <div className="flex items-center gap-2 font-medium text-sm">
         {bannerConfig.icon}
         {bannerConfig.message}
       </div>
       <button className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors ${bannerConfig.buttonClass}`}>
         Renew License
       </button>
    </div>
  );
}
