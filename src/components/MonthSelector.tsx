import { useMonthSelection } from "@/hooks/useMonthSelection";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

export function MonthSelector() {
  const {
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    setSelectedYear,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    isCurrentMonth,
  } = useMonthSelection();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Check if we can go to next month (don't allow future months)
  const canGoNext = !(selectedYear === currentYear && selectedMonth === currentMonth);

  // Generate year options (current year and 2 years back)
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(parseInt(value));
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value));
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-secondary/50">
      {/* Navigation arrows */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="hover:bg-secondary/80"
        >
          <ChevronLeft size={18} />
        </Button>
      </div>

      {/* Month and Year selectors */}
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[120px] h-9 border-border/50 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => {
              const monthNum = index + 1;
              // Disable future months in current year
              const isDisabled = selectedYear === currentYear && monthNum > currentMonth;
              return (
                <SelectItem
                  key={monthNum}
                  value={monthNum.toString()}
                  disabled={isDisabled}
                >
                  {month}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[85px] h-9 border-border/50 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Next month arrow and current month button */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={cn(
            "hover:bg-secondary/80",
            !canGoNext && "opacity-40 cursor-not-allowed"
          )}
        >
          <ChevronRight size={18} />
        </Button>
        {!isCurrentMonth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="hover:bg-secondary/80"
            title="Gå till aktuell månad"
          >
            <Calendar size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
