import React from 'react';
import logoImg from '@/assets/logo.png';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: {
            wrapper: 'px-2.5 py-1.5 rounded-lg',
            image: 'h-5 w-auto',
        },
        md: {
            wrapper: 'px-3 py-2 rounded-xl',
            image: 'h-7 w-auto',
        },
        lg: {
            wrapper: 'px-4 py-2.5 rounded-2xl',
            image: 'h-10 w-auto',
        },
    }[size];

    return (
        <div
            className={`inline-flex items-center relative overflow-hidden shadow-[0_10px_28px_rgba(2,51,151,0.28)] ring-1 ring-[#38E67D]/45 ${sizeClasses.wrapper} ${className}`}
            style={{ background: 'linear-gradient(135deg, #023397 0%, #023397 72%, #38E67D 100%)' }}
        >
            <img
                src={logoImg}
                alt="Esportes da Sorte Logo"
                className={`brand-logo-theme relative z-10 ${sizeClasses.image}`}
            />
            <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#38E67D]" aria-hidden="true" />
        </div>
    );
};

export default Logo;