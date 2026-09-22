import type { Metadata } from 'next';
import { AffiliateCatalog } from '@/components/AffiliateCatalog';
import { PageShell } from '@/components/PageShell';

export const metadata: Metadata = {
  title: 'Ofertas de parceiros',
  description: 'Produtos e promoções selecionados em lojas parceiras do Fazbrike.',
};

export default function OffersPage() {
  return (
    <PageShell>
      <AffiliateCatalog />
    </PageShell>
  );
}
