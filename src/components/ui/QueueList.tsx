interface QueueRow {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

interface QueueListProps {
  title: string;
  rows: QueueRow[];
}

/** The fulfilment-queue card (Kartly Commerce Kit.dc.html admin panel). */
const QueueList = ({ title, rows }: QueueListProps) => {
  return (
    <div className="rounded-panel bg-soft p-6 text-[var(--k-on-soft)]">
      <p className="mb-4.5 text-[15px] font-extrabold">{title}</p>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between rounded-[15px] px-3.75 py-3.25 ${
              row.emphasis ? 'bg-ink text-card' : 'bg-white/70'
            }`}
          >
            <span className="text-[12.5px] font-bold">{row.label}</span>
            <span className="text-[15px] font-black">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueueList;
