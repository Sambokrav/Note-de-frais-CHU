import React from 'react';

const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 9H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export const Header: React.FC = () => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    const targetId = event.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <LogoIcon />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Note de Frais CHU
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
            <a href="#contrat" onClick={handleNavClick} className="hover:text-blue-600 transition-colors">Contrat</a>
            <a href="#profil" onClick={handleNavClick} className="hover:text-blue-600 transition-colors">Profil</a>
            <a href="#justificatifs" onClick={handleNavClick} className="hover:text-blue-600 transition-colors">Justificatifs</a>
            <a href="#rib" onClick={handleNavClick} className="hover:text-blue-600 transition-colors">RIB</a>
            <a href="#recapitulatif" onClick={handleNavClick} className="hover:text-blue-600 transition-colors">Récapitulatif</a>
          </nav>
        </div>
      </div>
    </header>
  );
};
