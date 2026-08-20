import type { ReactNode } from "react";

type NexusPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function NexusPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: NexusPageHeaderProps) {
  return (
    <header className="mb-7 flex flex-col gap-4 border-b border-white/7 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
