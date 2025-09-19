import favicon from "../assets/favicon.ico";

export function Suggestion({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 border border-neutral-100 rounded-lg p-4 cursor-pointer">
      <img className="h-6 w-fit" src={favicon} alt="icon-x" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-neutral-400">{description}</div>
    </div>
  );
}
