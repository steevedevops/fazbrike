import React from 'react';
import Link from 'next/link';

type LogoProps = {
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
  markSize?: number;
  onClick?: () => void;
};

export const Logo: React.FC<LogoProps> = ({
  href = '/',
  showWordmark = true,
  className = '',
  markSize = 28,
  onClick,
}) => {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* SVG estático em /public/brand — <img> evita restrição do next/image com SVG */}
      <img
        src="/brand/fazbrike-mark.svg"
        alt=""
        width={markSize}
        height={markSize}
        className="shrink-0"
        decoding="async"
      />
      {showWordmark && (
        <span className="text-[17px] font-extrabold tracking-tight text-ink leading-none">
          fazbrike
        </span>
      )}
      <span className="sr-only">fazbrike</span>
    </span>
  );

  if (!href) {
    return <span onClick={onClick}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className="shrink-0 inline-flex no-underline hover:no-underline"
      onClick={onClick}
    >
      {content}
    </Link>
  );
};
