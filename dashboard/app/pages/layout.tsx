import { Outlet } from "react-router";
import Header from "~/components/layout/header";
import Footer from "~/components/layout/footer";

export default function BaseLayout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto flex-1 flex">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}