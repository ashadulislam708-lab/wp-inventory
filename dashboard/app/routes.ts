import { type RouteConfig, layout } from "@react-router/dev/routes";
import { authRoutes } from "./routes/auth.routes";
import { publicRoutes } from "./routes/public.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";

export default [
  // Auth routes (no layout wrapper)
  layout("pages/auth/layout.tsx", authRoutes),

  // Public routes (no layout wrapper)
  ...publicRoutes,

  // Protected dashboard routes (with sidebar layout)
  layout("pages/layout.tsx", dashboardRoutes),
] satisfies RouteConfig;
