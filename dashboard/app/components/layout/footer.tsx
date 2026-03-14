export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-6 mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} React Starter Kit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}