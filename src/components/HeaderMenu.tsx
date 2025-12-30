import { Upload, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface HeaderMenuProps {
  onImportClick: () => void;
}

export function HeaderMenu({ onImportClick }: HeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical size={18} />
          <span className="sr-only">Fler alternativ</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onImportClick}>
          <Upload size={16} className="mr-2" />
          Importera transaktioner
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
