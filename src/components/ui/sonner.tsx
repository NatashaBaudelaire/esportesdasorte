import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      closeButton
      visibleToasts={1}
      expand={false}
      offset={12}
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            "group toast group-[.toaster]:w-[calc(100vw-1rem)] group-[.toaster]:max-w-md group-[.toaster]:rounded-2xl group-[.toaster]:border-white/15 group-[.toaster]:bg-slate-900/95 group-[.toaster]:text-slate-100 group-[.toaster]:shadow-2xl",
          title: "text-sm font-semibold leading-tight",
          description: "text-xs text-slate-300",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:bg-transparent group-[.toast]:text-slate-300 group-[.toast]:border-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
