import { Construction } from "lucide-react";

/**
 * Stand-in for HSK learning pages, which live in the main HSK project.
 * When this module is merged into that project, these routes are replaced by the real pages.
 */
export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Construction className="mx-auto mb-4 size-10 text-muted" aria-hidden />
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <p className="mt-6 text-sm text-muted">
        This page belongs to the HSK learning system. The Fortune Teller module does not modify it.
      </p>
    </div>
  );
}
