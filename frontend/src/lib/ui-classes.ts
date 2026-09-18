const controlTransition =
  'transition-[background-color,border-color,color,box-shadow,opacity] duration-[var(--motion-instant)]';

export const containerClass = 'w-full max-w-[var(--layout-max)] mx-auto px-4 sm:px-6 lg:px-8';

export const pageStackClass = 'flex flex-col gap-8 sm:gap-10';

export const pageTitleClass = 'type-display text-ink';

export const pageLeadClass = 'type-body text-muted mt-2 max-w-2xl';

export const sectionTitleClass = 'type-title text-ink';

export const metaClass = 'type-meta text-muted';

export const listingGridClass =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8';

export const listingRailClass =
  'flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]';

export const listingRailItemClass = 'w-[200px] sm:w-[220px] shrink-0 snap-start';

export const listingMosaicClass =
  'grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-2 lg:h-[520px] lg:gap-4';

export const listingTileRowClass =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4';

export const listingBrowseClass =
  'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4';

export const chipClass = `inline-flex items-center justify-center gap-2 min-h-8 px-3.5 type-meta font-medium rounded-pill border border-[color:var(--color-border)] bg-surface text-ink ${controlTransition} hover:border-ink/25`;

export const chipActiveClass =
  'inline-flex items-center justify-center min-h-8 px-3 type-meta font-medium rounded-pill border border-ink bg-ink text-white';

export const panelClass =
  'bg-surface rounded-card border border-[color:var(--color-border)] shadow-card';

export const fieldClass = `w-full min-h-11 px-4 py-2.5 bg-subtle border border-[color:var(--color-border)] rounded-control type-body text-ink placeholder:text-muted ${controlTransition} focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`;

export const fieldErrorClass =
  'border-danger focus-visible:ring-danger';

export const labelClass = 'block type-meta font-medium text-ink mb-1.5';

export const errorBannerClass =
  'mb-6 p-4 bg-red-50 text-danger rounded-control type-meta';

export const helpClass = 'type-meta text-muted mt-1.5';

export const iconButtonClass = `inline-flex items-center justify-center h-11 w-11 rounded-control text-muted ${controlTransition} hover:text-ink hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`;

export const navLinkClass = `type-meta font-medium text-muted ${controlTransition} hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 rounded-sm`;

export const navLinkActiveClass = 'type-meta font-medium text-ink';

const btnBase = `inline-flex items-center justify-center min-h-11 px-5 type-body font-semibold rounded-control ${controlTransition} focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed`;

export const btnPrimaryClass = `${btnBase} bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-600`;

export const btnSecondaryClass = `${btnBase} bg-surface text-ink border border-[color:var(--color-border)] hover:border-ink/30 active:bg-subtle`;

export const btnGhostClass = `${btnBase} bg-transparent text-ink hover:bg-subtle active:bg-subtle`;

export const btnDangerClass = `${btnBase} bg-red-50 text-danger hover:bg-red-100 active:bg-red-100`;

export const btnInkClass = `${btnBase} bg-ink text-white hover:bg-neutral-800 active:bg-neutral-800`;

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
