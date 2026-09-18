import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 font-mono">
      <div className="relative max-w-md border border-zinc-800 bg-[#09090b] p-8 text-center shadow-2xl">
        <div className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-zinc-500" />
        <div className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-zinc-500" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-zinc-500" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-zinc-500" />

        <div className="mb-2 font-pixel text-4xl font-bold tracking-wider text-white">404</div>
        <div className="mb-2 text-xs uppercase tracking-widest text-zinc-400">Context Node Not Found</div>
        <p className="mb-6 text-xs text-zinc-600">
          The requested coordinate or memory route does not exist in the guardian index.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold tracking-wider text-zinc-200 uppercase transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          [ Return To Base ]
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 font-mono">
      <div className="relative max-w-md border border-zinc-800 bg-[#09090b] p-8 text-center shadow-2xl">
        <div className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-zinc-500" />
        <div className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-zinc-500" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-zinc-500" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-zinc-500" />

        <div className="mb-2 font-pixel text-2xl font-bold text-red-400">SYSTEM EXCEPTION</div>
        <p className="mb-6 text-xs text-zinc-500">
          An unexpected interruption occurred within the context pipeline.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 uppercase transition-colors hover:bg-zinc-800"
          >
            Retry Pipeline
          </button>
          <a
            href="/"
            className="border border-zinc-800 bg-black px-4 py-2 text-xs font-medium text-zinc-400 uppercase transition-colors hover:text-zinc-200"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          title: "Lelantos — Portable AI Context Layer",
        },
        {
          name: "description",
          content:
            "Your AI changes. Your context shouldn't. Portable AI context layer for persistent, user-owned AI context.",
        },
        { property: "og:title", content: "Lelantos" },
        {
          property: "og:description",
          content:
            "Portable AI context layer — keep your identity, preferences, and decisions across AI systems.",
        },
        { property: "og:type", content: "website" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Pixelify+Sans:wght@400;500;600;700&display=swap",
        },
        { rel: "icon", href: "/lelantos-logo.jpg", type: "image/jpeg" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
