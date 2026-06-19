"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import { sectionService } from "@/service/section.service";

const sectionKeys = {
  all: ["sections"] as const,
  detail: (id: string) => ["sections", id] as const,
  courses: ["courses"] as const,
};

export const useGetSectionsQuery = () =>
  useApiQuery(sectionKeys.all, sectionService.getSections);

export const useGetSectionByIdQuery = (id: string) =>
  useApiQuery(
    sectionKeys.detail(id),
    () => sectionService.getSectionById(id),
    { skip: !id },
  );

export const useAddSectionMutation = () =>
  useApiMutation({
    mutationFn: sectionService.addSection,
    invalidateKeys: [sectionKeys.all, sectionKeys.courses],
  });

export const useUpdateSectionMutation = () =>
  useApiMutation({
    mutationFn: sectionService.updateSection,
    invalidateKeys: [sectionKeys.all, sectionKeys.courses],
  });

export const useDeleteSectionMutation = () =>
  useApiMutation({
    mutationFn: sectionService.deleteSection,
    invalidateKeys: [sectionKeys.all, sectionKeys.courses],
  });

export const useReorderedSectionsMutation = () =>
  useApiMutation({
    mutationFn: sectionService.reorderSections,
    invalidateKeys: [sectionKeys.all, sectionKeys.courses],
  });
