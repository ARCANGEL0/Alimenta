import { useState } from 'react';

export default function ConfirmDialog({ texto, onConfirm }: { texto: string; onConfirm: () => void }) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button onClick={() => setAberta(true)}>Confirmar</button>
      {aberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-surface p-6 rounded-xl border border-line">
            <p className="text-sm text-ink">{texto}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setAberta(false); onConfirm(); }}>Confirmar</button>
              <button onClick={() => setAberta(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
