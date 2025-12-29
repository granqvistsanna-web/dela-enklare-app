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
      className="fixed bottom-20 right-6 lg:bottom-8 lg:right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
    >
      <Plus size={24} />
      <span className="sr-only">Lägg till transaktion</span>
    </Button>
  );
}
