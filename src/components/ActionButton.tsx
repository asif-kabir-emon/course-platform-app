import React, { ReactNode } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Loader2 } from "lucide-react";

export function ActionButton({
  action,
  tryAction,
  isOpen,
  setOpen,
  children,
}: {
  action: () => void;
  tryAction: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {isOpen && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 md:gap-1">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="hover:bg-black"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  action();
                }}
                disabled={tryAction}
              >
                {tryAction ? (
                  <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
                ) : (
                  "Yes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
