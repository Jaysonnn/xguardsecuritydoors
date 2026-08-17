import type { ServiceType } from "@prisma/client";

/**
 * The service picker on the booking form.
 *
 * `value` is typed as the Prisma enum via a type-only import, which is erased at
 * build time so no Prisma code reaches the client bundle. If the enum in
 * schema.prisma changes and this list is not updated, the build fails here
 * rather than at runtime on a customer's submission.
 */
export interface ServiceOption {
  value: ServiceType;
  label: string;
  /** Gallery slug this maps to, where one exists. */
  slug?: string;
}

export const SERVICE_OPTIONS: readonly ServiceOption[] = [
  { value: "DIAMOND_DOOR", label: "Diamond grille door", slug: "diamond-doors" },
  { value: "DESIGN_DOOR", label: "Design door", slug: "design-doors" },
  { value: "PRIVACY_MESH_DOOR", label: "Privacy mesh door", slug: "privacy-mesh-doors" },
  { value: "PERFORATED_MESH", label: "Perforated mesh", slug: "perforated-mesh" },
  { value: "STAINLESS_STEEL_DOOR", label: "Stainless steel door", slug: "stainless-steel-doors" },
  { value: "SLIDING_DOOR", label: "Sliding security door", slug: "sliding-doors" },
  { value: "DOUBLE_DOOR", label: "Double entry doors", slug: "double-doors" },
  { value: "ROLLER_SHUTTER", label: "Roller shutters", slug: "roller-shutters" },
  { value: "WINDOW_GRILLE", label: "Window grilles", slug: "window-grills" },
  { value: "FLY_SCREEN", label: "Fly screens" },
  { value: "REPAIR", label: "Repair or re-mesh" },
  { value: "OTHER", label: "Something else" },
] as const;
