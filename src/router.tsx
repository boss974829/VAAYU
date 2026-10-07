import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
  });
}

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-3 px-6">
      <h1 className="title">That page isn’t here</h1>
      <p className="text-muted">The link may be old.</p>
      <a className="font-medium underline" href="/">
        Back to places
      </a>
    </main>
  );
}
