'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-serif font-bold text-gray-900 tracking-tight">
              FAZBRIKE
            </span>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Compre e venda de forma simples, segura e direta.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-3">
              Explorar
            </h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Loja</Link></li>
              <li><Link href="/novidades" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Novidades</Link></li>
              <li><Link href="/marcas" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Marcas</Link></li>
              <li><Link href="/promocoes" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Promoções</Link></li>
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-3">
              Marketplace
            </h3>
            <ul className="space-y-2">
              <li><Link href="/vender" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Vender um item</Link></li>
              <li><Link href="/categoria/eletronicos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Eletrônicos</Link></li>
              <li><Link href="/categoria/moveis" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Móveis</Link></li>
              <li><Link href="/categoria/veiculos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Veículos</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-3">
              Conta
            </h3>
            <ul className="space-y-2">
              <li><Link href="/perfil" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Meu perfil</Link></li>
              <li><Link href="/messages" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Mensagens</Link></li>
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Entrar</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Fazbrike. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-400">
            Feito com dedicação no Brasil.
          </p>
        </div>
      </div>
    </footer>
  );
};
