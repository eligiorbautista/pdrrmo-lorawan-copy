/**
 * LogoIcon — renders the project's logo image as an icon component.
 * Defaults to filling its container (w-full h-full) with object-cover
 * so circular logos completely fill circular containers edge-to-edge.
 */
export function LogoIcon({
  className,
  ...props
}: {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <img
      src="/logo.png"
      alt="PDRRMO Logo"
      className={`${className ?? "w-full h-full"} object-cover`}
      {...props}
    />
  );
}
