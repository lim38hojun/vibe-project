import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DiaryLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
