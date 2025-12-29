import { useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AddFabProps {
  onClick: () => void;
  onImportClick?: () => void;
}

export function AddFab({ onClick, onImportClick }: AddFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddClick = () => {
    setIsOpen(false);
    onClick();
  };

  const handleImportClick = () => {
    setIsOpen(false);
    onImportClick?.();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Menu options */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 z-40 flex flex-col-reverse gap-3 items-end">
            {onImportClick && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.15, delay: 0.05 }}
              >
                <Button
                  onClick={handleImportClick}
                  variant="outline"
                  size="sm"
                  className="gap-2 shadow-notion-lg hover:shadow-xl bg-background border-border"
                >
                  <Upload size={16} />
                  <span>Importera</span>
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                onClick={handleAddClick}
                variant="outline"
                size="sm"
                className="gap-2 shadow-notion-lg hover:shadow-xl bg-background border-border"
              >
                <Plus size={16} />
                <span>Lägg till</span>
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 h-12 w-12 rounded-full shadow-notion-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={20} /> : <Plus size={20} />}
        </motion.div>
        <span className="sr-only">Lägg till transaktion</span>
      </Button>
    </>
  );
}
