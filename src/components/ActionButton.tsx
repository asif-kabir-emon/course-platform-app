"use client";
import React, { ReactNode, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Loader2 } from "lucide-react";

export function ActionButton({
  action,
  tryAction,
  children,
}: {
  action: () => void;
  tryAction: boolean;
  children: ReactNode;
}) {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <div>
      <Dialog open={isOpened} onOpenChange={setIsOpened}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        {isOpened && (
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
                onClick={() => {
                  setIsOpened(false);
                }}
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
