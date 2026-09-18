'use client';

import React, { useState } from 'react';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  fieldClass,
  labelClass,
  panelClass,
} from '@/lib/ui-classes';

export type SaleChannel = 'platform' | 'off_platform' | 'not_sold';

export interface MarkSoldResult {
  channel: SaleChannel;
  finalPrice: number | null;
  comment: string;
}

interface MarkSoldModalProps {
  itemTitle: string;
  onCancel: () => void;
  onConfirm: (result: MarkSoldResult) => Promise<void> | void;
}

const channelOptions: { value: SaleChannel; label: string }[] = [
  { value: 'platform', label: 'Vendi aqui na plataforma' },
  { value: 'off_platform', label: 'Vendi fora da plataforma' },
  { value: 'not_sold', label: 'Não vendi, só desativando' },
];

export function MarkSoldModal({ itemTitle, onCancel, onConfirm }: MarkSoldModalProps) {
  const [channel, setChannel] = useState<SaleChannel>('platform');
  const [finalPrice, setFinalPrice] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showPriceField = channel === 'platform' || channel === 'off_platform';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({
        channel,
        finalPrice: showPriceField && finalPrice ? Number(finalPrice) : null,
        comment: comment.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`${panelClass} w-full max-w-md bg-surface p-5`}>
          <h2 className="type-title text-ink mb-1">Encerrar anúncio</h2>
          <p className="type-meta text-muted mb-4">
            &quot;{itemTitle}&quot; — conte pra gente o que aconteceu, isso nos ajuda a melhorar a plataforma.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              {channelOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 type-body text-ink">
                  <input
                    type="radio"
                    name="channel"
                    value={opt.value}
                    checked={channel === opt.value}
                    onChange={() => setChannel(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {showPriceField ? (
              <div>
                <label htmlFor="final_price" className={labelClass}>
                  Preço final da venda (opcional)
                </label>
                <input
                  id="final_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  className={fieldClass}
                  placeholder="0,00"
                />
              </div>
            ) : null}
            <div>
              <label htmlFor="comment" className={labelClass}>
                Comentário (opcional)
              </label>
              <textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={fieldClass}
                placeholder="Conte como foi a experiência de venda"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className={btnSecondaryClass} onClick={onCancel} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimaryClass} disabled={submitting}>
                {submitting ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
