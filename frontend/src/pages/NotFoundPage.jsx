import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/ui";

export function NotFoundPage({ home = "/", label = "Go home" }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-16 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-fg-subtle">
          <Compass className="h-6 w-6" aria-hidden />
        </div>
        <p className="num text-sm font-medium text-accent">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link to={home} className="mt-6 inline-block">
          <Button>{label}</Button>
        </Link>
      </div>
    </div>
  );
}
