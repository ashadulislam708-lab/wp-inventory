import { Link } from "react-router";
import type { Route } from "../pages/+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">This is the home page</h1>
        <div className="flex flex-col items-center gap-4">
          <Link
            to="/login"
            className="text-primary hover:underline text-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
