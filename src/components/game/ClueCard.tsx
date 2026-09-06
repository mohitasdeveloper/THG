import Card from "@/components/ui/Card";

export default function ClueCard({
  sequenceOrder,
  clueText,
}: {
  sequenceOrder: number;
  clueText: string;
}) {
  return (
    <Card className="animate-fade-slide-up">
      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
        📜 Clue {sequenceOrder}
      </div>
      <p className="text-base leading-relaxed whitespace-pre-line">{clueText}</p>
    </Card>
  );
}
