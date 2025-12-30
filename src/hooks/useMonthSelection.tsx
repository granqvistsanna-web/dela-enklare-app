import { createContext, useContext, useState, ReactNode } from "react";

interface MonthSelectionContextType {
  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  isCurrentMonth: boolean;
}

const MonthSelectionContext = createContext<MonthSelectionContextType | undefined>(undefined);

export const MonthSelectionProvider = ({ children }: { children: ReactNode }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Don't allow going beyond current month
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return;
    }

    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
  };

  return (
    <MonthSelectionContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setSelectedMonth,
        setSelectedYear,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        isCurrentMonth: isCurrentMonth(),
      }}
    >
      {children}
    </MonthSelectionContext.Provider>
  );
};

export const useMonthSelection = () => {
  const context = useContext(MonthSelectionContext);
  if (context === undefined) {
    throw new Error("useMonthSelection must be used within a MonthSelectionProvider");
  }
  return context;
};
