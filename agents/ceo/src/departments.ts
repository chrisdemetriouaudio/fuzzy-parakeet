// The departments switched on in phase 1. Each lives in its own folder: agents/<role>/agent.ts.
// Coming later: Strategy, PMO, Marketing, SEO, AEO/GEO, UX, Design, Security, Legal, Support, Ops.
import { copy } from "../../copy/agent.ts";
import { devops } from "../../devops/agent.ts";
import { engineering } from "../../engineering/agent.ts";
import { finance } from "../../finance/agent.ts";
import { qa } from "../../qa/agent.ts";
import { sales } from "../../sales/agent.ts";
import type { Department, DepartmentId } from "./types.ts";

export const departments: Record<DepartmentId, Department> = {
  sales,
  copy,
  engineering,
  qa,
  devops,
  finance,
};
