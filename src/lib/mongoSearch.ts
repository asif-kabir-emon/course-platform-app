import { Prisma } from "@prisma/client";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const caseInsensitiveMongoFilter = (
  field: string,
  search: string,
): Prisma.InputJsonValue =>
  ({
    [field]: {
      $regex: escapeRegExp(search),
      $options: "i",
    },
  }) as Prisma.InputJsonValue;

export const extractMongoIds = (result: Prisma.JsonObject): string[] => {
  if (!Array.isArray(result)) {
    return [];
  }

  return result.flatMap((document) => {
    if (!document || typeof document !== "object" || Array.isArray(document)) {
      return [];
    }

    const rawId = document._id;

    if (typeof rawId === "string") {
      return [rawId];
    }

    if (
      rawId &&
      typeof rawId === "object" &&
      !Array.isArray(rawId) &&
      typeof rawId.$oid === "string"
    ) {
      return [rawId.$oid];
    }

    return [];
  });
};
