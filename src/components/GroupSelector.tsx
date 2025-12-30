import { Group } from "@/hooks/useGroups";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

interface GroupSelectorProps {
  groups: Group[];
  selectedGroupId: string | undefined;
  onSelectGroup: (groupId: string) => void;
}

export function GroupSelector({ groups, selectedGroupId, onSelectGroup }: GroupSelectorProps) {
  if (groups.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={selectedGroupId} onValueChange={onSelectGroup}>
        <SelectTrigger className="w-[140px] sm:w-[180px] h-9 bg-background/50 border-border/50">
          <SelectValue placeholder="Välj grupp" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
