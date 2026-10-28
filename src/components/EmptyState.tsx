export default function EmptyState({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted text-sm">
      <p>{mensagem}</p>
    </div>
  );
}
