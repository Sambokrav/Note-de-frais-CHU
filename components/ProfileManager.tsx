import React, { useState, useEffect } from 'react';
import { ProfileData } from '../types';

interface ProfileManagerProps {
  onProfileChange: (data: Omit<ProfileData, 'rib'> | null) => void;
  initialData: Omit<ProfileData, 'rib'> | null;
  rememberMe: boolean;
  onRememberMeChange: (value: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
        <path d="M20 6 9 17l-5-5"></path>
    </svg>
);

export const ProfileManager: React.FC<ProfileManagerProps> = ({ onProfileChange, initialData, rememberMe, onRememberMeChange, addNotification }) => {
  const [profileInfo, setProfileInfo] = useState({
    title: 'Dr.',
    lastName: '',
    firstName: '',
    rpps: '',
    email: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Ensure all keys exist to avoid uncontrolled component warnings
      setProfileInfo({
        title: initialData.title || 'Dr.',
        lastName: initialData.lastName || '',
        firstName: initialData.firstName || '',
        rpps: initialData.rpps || '',
        email: initialData.email || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    const { title, lastName, firstName, rpps, email } = profileInfo;
    const isValid = title?.trim() !== '' && 
                    lastName?.trim() !== '' && 
                    firstName?.trim() !== '' && 
                    rpps?.trim() !== '' && 
                    /^\S+@\S+\.\S+$/.test(email?.trim() || '');

    if (isValid) {
      onProfileChange(profileInfo);
      if (!isSaved) {
        addNotification('Profil enregistré avec succès.', 'success');
      }
      setIsSaved(true);
    } else {
      onProfileChange(null);
      setIsSaved(false);
    }
  }, [profileInfo, onProfileChange, addNotification, isSaved]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileInfo(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };
  
  const handleRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onRememberMeChange(e.target.checked);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-end gap-4">
            <div className="w-24 flex-shrink-0">
                <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">Titre</label>
                <div className="mt-2">
                    <select
                        id="title"
                        name="title"
                        value={profileInfo.title}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                        <option>Dr.</option>
                        <option>Pr.</option>
                    </select>
                </div>
            </div>
            <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900">Nom</label>
                <div className="mt-2">
                    <input type="text" name="lastName" id="lastName" value={profileInfo.lastName} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Weizman" />
                </div>
            </div>
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900">Prénom</label>
           <div className="mt-2">
            <input type="text" name="firstName" id="firstName" value={profileInfo.firstName} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Jean" />
           </div>
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rpps" className="block text-sm font-medium leading-6 text-gray-900">RPPS</label>
          <div className="mt-2">
            <input type="text" name="rpps" id="rpps" value={profileInfo.rpps} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="10..." />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email Professionnel</label>
          <div className="mt-2">
            <input type="email" name="email" id="email" value={profileInfo.email} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="jean.dupont@chu.fr" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center">
            <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="remember-me" className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                Se souvenir de moi
            </label>
        </div>
        {isSaved && (
          <div className="flex items-center">
              <CheckIcon />
              <span className="ml-2 text-sm text-green-600">Profil Enregistré</span>
          </div>
         )}
       </div>
    </div>
  );
};