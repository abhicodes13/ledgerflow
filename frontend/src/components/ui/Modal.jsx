import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

const widths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[var(--overlay)] p-4 backdrop-blur-sm animate-fadeIn">
          <Dialog.Content
            {...(description ? {} : { "aria-describedby": undefined })}
            className={cn(
              "w-full rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)] focus:outline-none",
              widths[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <div className="min-w-0">
                <Dialog.Title className="text-base font-semibold text-fg">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-0.5 text-sm text-fg-muted">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label="Close"
                className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <X className="h-4 w-4" aria-hidden />
              </Dialog.Close>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              {children}
            </div>

            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
