import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2 } from "lucide-react";
import { readPage } from "@/lib/search.functions";
import { useLuna } from "@/lib/luna-store";

export function ReaderView({ url }: { url: string }) {
  const { updateActivePage } = useLuna();
  const run = useServerFn(readPage);
  const { data, isLoading } = useQuery({
    queryKey: ["reader", url],
    queryFn: () => run({ data: { url } }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      updateActivePage({
        title: data.title,
        hero: data.title,
        sections: data.sections,
        favicon: data.domain.slice(0, 1).toUpperCase(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <article className="mx-auto max-w-2xl px-10 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {data?.domain ?? url} · Reader
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{data?.title ?? "Loading…"}</h1>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
      >
        Open original <ExternalLink className="h-3 w-3" />
      </a>

      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Luna is loading this page…
        </div>
      )}

      <div className="mt-8 space-y-6">
        {data?.sections.map((s, i) => (
          <p key={i} className="text-[14.5px] leading-7 text-foreground/85">
            {s.body}
          </p>
        ))}
      </div>
    </article>
  );
}
