"use client";
import { CourseSectionStatus } from "@prisma/client";
import React, { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import SectionForm from "./SectionForm";

const SectionFormDialog = ({
  courseId,
  section,
  children,
}: {
  courseId: string;
  section?: {
    id: string;
    name: string;
    status: CourseSectionStatus;
  };
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {section ? `Edit ${section.name}` : "New Section"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <SectionForm
            section={section}
            courseId={courseId}
            onSuccess={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionFormDialog;
