'use client';

import React, { useEffect, useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const toggleMode = () => {
        setIsLogin(!isLogin);
    };

    // Se já autenticado, vai direto para o perfil
    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/perfil');
        }
    }, [loading, isAuthenticated, router]);

    if (loading || isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />
            <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {isLogin ? (
                    <LoginForm onToggleMode={toggleMode} />
                ) : (
                    <RegisterForm onToggleMode={toggleMode} />
                )}
            </div>
            <Footer />
        </div>
    );
}
