import { route } from "@react-router/dev/routes";

export const publicRoutes = [
  route("tracking/:invoiceId", "pages/tracking/TrackingPage.tsx"),
];
