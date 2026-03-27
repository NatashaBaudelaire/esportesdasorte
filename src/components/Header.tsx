import { useState } from 'react';
import { Search, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import GlobalSearch from '@/components/GlobalSearch';


<img src={logo} alt="Logo" />

const Header = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-section px-4 py-3 relative">
        
        <div className="flex items-center justify-between max-w-7xl mx-auto relative">
          
          {/* Perfil à esquerda */}
          <button
            onClick={() => navigate('/perfil')}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            <UserCircle size={24} />
          </button>

          {/* LOGO CENTRAL REAL */}
          <button
            onClick={() => navigate('/')}
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
          >
            <img 
              src={logo}
              alt="Logo"
              className="h-6 object-contain"
            />
          </button>

          {/* Busca à direita */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            <Search size={22} />
          </button>
        </div>
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;