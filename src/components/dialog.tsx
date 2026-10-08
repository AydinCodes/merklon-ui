"use client";

import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "../lib/cx";
import { Slot } from "../lib/slot";
import type { Tone } from "../lib/types";
import { useControllable } from "../lib/use-controllable";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  triggerRef: RefObject<HTMLElement | null>;
  role: "dialog" | "alertdialog";
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog(component: string) {
  const context = use(DialogContext);
  if (!context) throw new Error(`<${component}> must be inside <Dialog> or <AlertDialog>.`);
  return context;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function DialogRoot({ role, open, defaultOpen = false, onOpenChange, children }: DialogProps & { role: DialogContextValue["role"] }) {
  const [isOpen, setOpen] = useControllable({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <DialogContext
      value={{ open: isOpen, setOpen, titleId: `${id}-title`, descriptionId: `${id}-description`, triggerRef, role }}
    >
      {children}
    </DialogContext>
  );
}

/** A modal dialog. Native <dialog>: focus trap, inert page and Esc come from the browser. */
export function Dialog(props: DialogProps) {
  return <DialogRoot {...props} role="dialog" />;
}

/**
 * For destructive or irreversible confirmation. The backdrop does not
 * dismiss it, and initial focus lands on the cancel action (put autoFocus on
 * it) — the safe choice is the default one.
 */
export function AlertDialog(props: DialogProps) {
  return <DialogRoot {...props} role="alertdialog" />;
}

export function DialogTrigger({ children }: { children: ReactElement }) {
  const { open, setOpen, triggerRef } = useDialog("DialogTrigger");
  return (
    <Slot
      ref={triggerRef}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      {children}
    </Slot>
  );
}

export function DialogClose({ children }: { children: ReactElement }) {
  const { setOpen } = useDialog("DialogClose");
  return <Slot onClick={() => setOpen(false)}>{children}</Slot>;
}

export interface DialogContentProps extends Omit<ComponentPropsWithRef<"dialog">, "open"> {
  size?: "sm" | "md" | "lg";
  tone?: Tone;
  /** Hide the corner close button (alert dialogs never show it). */
  hideClose?: boolean;
}

export function DialogContent({ size = "md", tone, hideClose, className, children, ...props }: DialogContentProps) {
  const { open, setOpen, titleId, descriptionId, triggerRef, role } = useDialog("DialogContent");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Scale out of the trigger: point the transform origin at it.
      const trigger = triggerRef.current?.getBoundingClientRect();
      const box = dialog.getBoundingClientRect();
      if (trigger && box.width) {
        const x = trigger.left + trigger.width / 2 - box.left;
        const y = trigger.top + trigger.height / 2 - box.top;
        dialog.style.setProperty("--mk-origin", `${x}px ${y}px`);
      } else {
        dialog.style.removeProperty("--mk-origin");
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, triggerRef]);

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    // The panel fills the <dialog> box; a click landing on the element
    // itself was on the backdrop.
    if (role === "dialog" && event.target === event.currentTarget) setOpen(false);
  };

  return (
    <dialog
      {...props}
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cx("mk-dialog", className)}
      data-size={size}
      data-tone={tone}
      onCancel={(event) => {
        // Esc: keep React as the source of truth.
        event.preventDefault();
        setOpen(false);
      }}
      onClick={onBackdropClick}
    >
      <div className="mk-dialog-panel">
        {children}
        {!hideClose && role === "dialog" && (
          <button type="button" className="mk-dialog-close" aria-label="Close" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </dialog>
  );
}

export function DialogHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx("mk-dialog-header", className)} />;
}

export function DialogTitle({ className, ...props }: ComponentPropsWithRef<"h2">) {
  const { titleId } = useDialog("DialogTitle");
  return <h2 {...props} id={titleId} className={cx("mk-dialog-title", className)} />;
}

export function DialogDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  const { descriptionId } = useDialog("DialogDescription");
  return <p {...props} id={descriptionId} className={cx("mk-dialog-description", className)} />;
}

export function DialogBody({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx("mk-dialog-body", className)} />;
}

export function DialogFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx("mk-dialog-footer", className)} />;
}
