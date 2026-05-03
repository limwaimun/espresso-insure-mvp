// Loads vision.md and workstreams.md fresh on every call.

import { readFileSync } from "fs";
import { join } from "path";

export function loadVision(): string {
  try {
    return readFileSync(join(process.cwd(), "brain", "vision.md"), "utf8");
  } catch {
    return "# Vision\n(brain/vision.md not found)";
  }
}

export function loadWorkstreams(): string {
  try {
    return readFileSync(join(process.cwd(), "brain", "workstreams.md"), "utf8");
  } catch {
    return "# Workstreams\n(brain/workstreams.md not found)";
  }
}

export const WORKSTREAMS = [
  { id: "marketing", name: "Marketing site (espresso.insure)" },
  { id: "fa_app", name: "FA app (Espresso product)" },
  { id: "ai_agents", name: "AI agents" },
  { id: "admin_dashboard", name: "Admin dashboard" },
] as const;

export type WorkstreamId = (typeof WORKSTREAMS)[number]["id"];
