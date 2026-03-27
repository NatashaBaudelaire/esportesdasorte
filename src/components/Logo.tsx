import React from 'react';
import logoImg from '@/assets/logo.png';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-8 w-auto',
        md: 'h-12 w-auto',
        lg: 'h-20 w-auto',
    }[size];

    return (
        <img 
            src={logoImg} 
            alt="Esportes da Sorte Logo" 
            className={`${sizeClasses} ${className}`}
        />
    );
};

export default Logo;