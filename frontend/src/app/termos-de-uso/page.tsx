import { LegalDocumentPage, legalMetadata } from '@/components/legal/LegalDocumentPage';

// Texto editável no admin: renderiza por requisição (com cache curto do fetch)
// para não congelar o conteúdo do momento do build.
export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return legalMetadata('termos-de-uso');
}

export default function Page() {
  return <LegalDocumentPage slug="termos-de-uso" />;
}
