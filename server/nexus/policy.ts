import { TRPCError } from "@trpc/server";
import type { OrganizationMembershipRole } from "../../drizzle/schema";

export type AccessScope = {
  orgId: number;
  userId: number;
  role: OrganizationMembershipRole;
  collectionIds: number[];
};

export function canManageOrganization(role: OrganizationMembershipRole) {
  return role === "owner" || role === "admin";
}

export function canManageCollection(role: OrganizationMembershipRole) {
  return role === "owner" || role === "admin";
}

export function canUploadToCollection(role: OrganizationMembershipRole) {
  return role !== "viewer";
}

export function hasCollectionAccess(scope: AccessScope, collectionId: number) {
  return canManageOrganization(scope.role) || scope.collectionIds.includes(collectionId);
}

export function assertCollectionAccess(scope: AccessScope, collectionId: number) {
  if (!hasCollectionAccess(scope, collectionId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This collection is outside your approved access scope." });
  }
}

export function assertOrganizationManager(scope: AccessScope) {
  if (!canManageOrganization(scope.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Organization management requires an Owner or Admin role." });
  }
}
