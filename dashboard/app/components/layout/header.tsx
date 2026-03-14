import { Link } from "react-router";

export default function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <Link to="/" className="text-xl font-bold">
          React Starter
        </Link>
        <nav className="flex gap-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="/login" className="hover:text-primary">Login</Link>
        </nav>
      </div>
    </header>
  );
}