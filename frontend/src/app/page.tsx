'use client';

import React from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { HomeRail } from '@/components/HomeRail';
import { AffiliateProductRail } from '@/components/AffiliateProductRail';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CATEGORIES } from '@/lib/catalog';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  containerClass,
  metaClass,
  navLinkClass,
  pageTitleClass,
  panelClass,
  sectionTitleClass,
} from '@/lib/ui-classes';

const HOME_CATEGORIES = [
  'veiculos',
  'locacao-imoveis',
  'imoveis',
  'eletronicos',
  'roupas',
  'moveis',
  'eletrodomesticos',
  'esportes',
] as const;


const slimBanners = [
  {
    href: '/vender',
    title: 'Publique em minutos',
    text: 'Anuncie com foto, preço e localização.',
    image: '/highlights/highlight-publish.jpg',
  },
  {
    href: '/messages',
    title: 'Converse direto',
    text: 'Fale com o vendedor sem intermediários.',
    image: '/highlights/highlight-chat.jpg',
  },
  {
    href: '/promocoes',
    title: 'Sem burocracia',
    text: 'Encontre o que precisa e feche o trato.',
    image: '/highlights/highlight-deal.jpg',
  },
];

export default function Home() {
  return (
    <PageShell flush>
      <section className={`${containerClass} pt-6`}>
        <div className={`${panelClass} relative overflow-hidden`}>
          <div className="relative min-h-[240px] sm:min-h-[320px]">
            <img
              src="/highlights/highlight-publish.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-ink/55" />
            <div className="relative z-10 flex min-h-[240px] flex-col justify-center px-6 py-10 sm:min-h-[320px] sm:px-10 sm:py-14">
              <h1 className={`${pageTitleClass} text-white max-w-xl`}>
                Compre. Venda. Conecte.
              </h1>
              <p className="type-body text-white/80 mt-2 max-w-lg">
                O marketplace simples para descobrir produtos e vender o que você não usa mais.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/vender" className={btnPrimaryClass}>
                  Vender um item
                </Link>
                <Link href="/novidades" className={btnSecondaryClass}>
                  Explorar novidades
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${containerClass} pt-8`} aria-label="Categorias">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className={sectionTitleClass}>Categorias</h2>
            <p className={`${metaClass} mt-1`}>Escolha uma categoria para começar</p>
          </div>
          <Link href="/geral" className={navLinkClass}>
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {HOME_CATEGORIES.map((slug) => {
            const category = CATEGORIES.find((c) => c.slug === slug);
            if (!category) return null;
            return (
              <Link
                key={category.slug}
                href={`/geral?category=${category.slug}`}
                className="group flex items-center gap-3 rounded-card border border-[color:var(--color-border)] bg-surface px-3.5 py-3.5 hover:border-ink/25 transition-colors"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-subtle text-ink group-hover:bg-brand-50">
                  <CategoryIcon slug={category.icon || category.slug} className="h-5 w-5" />
                </span>
                <span className="type-meta font-medium text-ink leading-snug">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <HomeRail
        title="Novidades"
        subtitle="Acabaram de chegar na vitrine"
        href="/novidades"
        linkLabel="Ver todas"
        query=""
      />

      <AffiliateProductRail />

      <HomeRail
        title="Eletrônicos"
        subtitle="Do celular ao notebook, no seu ritmo"
        href="/geral?category=eletronicos"
        linkLabel="Ver todos"
        query="category=eletronicos"
      />

      <HomeRail
        title="Veículos"
        subtitle="Carros, motos e mais perto de você"
        href="/geral?category=veiculos"
        linkLabel="Ver todos"
        query="category=veiculos"
      />

      <HomeRail
        title="Imóveis"
        subtitle="Venda e oportunidades locais"
        href="/geral?category=imoveis"
        linkLabel="Ver todos"
        query="category=imoveis"
      />

      <section className={`${containerClass} pt-12`} aria-label="Destaques">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {slimBanners.map((banner) => (
            <Link
              key={banner.title}
              href={banner.href}
              className={`${panelClass} group overflow-hidden`}
            >
              <div className="relative h-28 overflow-hidden bg-subtle sm:h-32">
                <img
                  src={banner.image}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-ink/45" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="type-title text-white">{banner.title}</p>
                  <p className="type-meta text-white/80 mt-0.5">{banner.text}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <HomeRail
        title="Promoções"
        subtitle="Os menores preços do momento"
        href="/promocoes"
        linkLabel="Ver todas"
        query="sort_by=price&order=asc"
      />

      <section className={`${containerClass} pt-12`}>
        <Link href="/vender" className={`${panelClass} group relative block overflow-hidden`}>
          <div className="relative h-28 overflow-hidden bg-subtle sm:h-36">
            <img
              src="/highlights/highlight-choice.jpg"
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-ink/50" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <p className="type-title text-white">Do seu jeito</p>
              <p className="type-meta text-white/80 mt-1 max-w-lg">
                Novo, usado ou quase novo — publique o que você não usa mais.
              </p>
            </div>
          </div>
        </Link>
      </section>

      <HomeRail
        title="Roupas e acessórios"
        subtitle="Peças prontas para um novo dono"
        href="/geral?category=roupas"
        linkLabel="Ver todas"
        query="category=roupas"
      />

      <HomeRail
        title="Móveis"
        subtitle="Casa e escritório sem complicação"
        href="/geral?category=moveis"
        linkLabel="Ver todos"
        query="category=moveis"
      />

      <div className="pb-16">
        <HomeRail
          title="Esportes"
          subtitle="Equipamentos e lazer"
          href="/geral?category=esportes"
          linkLabel="Ver todos"
          query="category=esportes"
        />
      </div>
    </PageShell>
  );
}
