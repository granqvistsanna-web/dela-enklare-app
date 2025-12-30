import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddFabProps {
  onClick: () => void;
}

export function AddFab({ onClick }: AddFabProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 h-14 w-14 rounded-full shadow-notion-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
    >
      <Plus size={24} />
      <span className="sr-only">Lägg till transaktion</span>
    </Button>
  );
}
