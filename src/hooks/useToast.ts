import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; tipo: string } | null>(null);

  function mostrar(msg: string, tipo: string = 'info') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  return { toast, mostrar };
}
