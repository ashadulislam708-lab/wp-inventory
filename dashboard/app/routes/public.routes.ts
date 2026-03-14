import { route, index } from "@react-router/dev/routes";

export const publicRoutes = [
  index("pages/home.tsx"),
  route("about", "pages/public/about.tsx"),
];