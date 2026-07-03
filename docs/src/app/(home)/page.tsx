import Link from 'next/link';
import { mcpEndpoint } from '@/lib/shared';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 text-6xl" aria-hidden>
        🚴
      </div>
      <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Tour de France MCP
      </h1>
      <p className="mb-8 max-w-xl text-lg text-fd-muted-foreground">
        A Model Context Protocol server that exposes the public Tour de France
        Race Center API — stages, teams, riders, live rankings, telemetry and
        commentary — as 22 self-describing MCP tools.
      </p>

      <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Read the docs
        </Link>
        <Link
          href="/docs/tools/overview"
          className="rounded-lg border border-fd-border px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
        >
          Browse the tools
        </Link>
      </div>

      <div className="w-full max-w-xl rounded-xl border border-fd-border bg-fd-card p-4 text-left">
        <p className="mb-2 text-sm font-medium text-fd-muted-foreground">
          Streamable HTTP endpoint
        </p>
        <code className="block overflow-x-auto whitespace-nowrap rounded-md bg-fd-secondary px-3 py-2 font-mono text-sm">
          {mcpEndpoint}
        </code>
      </div>
    </main>
  );
}
