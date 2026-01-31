import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/shared/ui/dialog";

type Props = {
  src: string;
  alt: string;
  className?: string;
  children: React.ReactNode;
};

export function ImageDialog({ src, alt, children }: Props) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <div className="flex h-full w-full items-center justify-center p-8 cursor-pointer" />
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent className="!max-w-none !w-[95vw] !h-[95vh] p-0 !rounded-lg !border">
        <div className="flex items-center justify-center h-full">
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
