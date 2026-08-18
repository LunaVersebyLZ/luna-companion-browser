import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search } from "lucide-react";
import { webSearch } from "@/lib/search.functions";
import { useLuna } from "@/lib/luna-store";

export function SearchResultsView({ query, engineId }: { query: string; engineId: string }) {
  const { openReader } = useLuna();
  const run = useServerFn(webSearch);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", engineId, query],
    queryFn: () => run({ data: { query, engineId } }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Search className="h-3 w-3" />
        {data?.source ?? "Search"} results
      </div>
      <h1 className="mt-3 text-3xl font-semibold">{query}</h1>

      {data?.note && (
        <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-[12px] text-muted-foreground">
          {data.note}
        </p>
      )}

      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Luna is fetching results…
        </div>
      )}
      {isError && <p className="mt-8 text-sm text-muted-foreground">Search failed. Try again.</p>}

      <div className="mt-8 space-y-6">
        {data?.results.map((r) => (
          <article key={r.url}>
            <button
              onClick={() => openReader(r.url, r.title)}
              className="block text-left"
            >
              <p className="text-[11.5px] text-muted-foreground">{r.domain}</p>
              <h2 className="mt-0.5 text-[17px] font-medium text-primary hover:underline">
                {r.title}
              </h2>
            </button>
            {r.snippet && (
              <p className="mt-1 text-[13.5px] leading-6 text-foreground/80">{r.snippet}</p>
            )}
          </article>
        ))}
        {data && !isLoading && data.results.length === 0 && (
          <p className="text-sm text-muted-foreground">No results found.</p>
        )}
      </div>
    </div>
  );
}
