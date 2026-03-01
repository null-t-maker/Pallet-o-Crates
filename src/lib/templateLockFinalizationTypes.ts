import type { ParsedTemplatePlacement } from "./templateLockParsing";

export interface FinalTemplatePlacement extends ParsedTemplatePlacement {
  assignedTypeId: string;
}
