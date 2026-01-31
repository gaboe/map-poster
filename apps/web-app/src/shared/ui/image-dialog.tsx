import { useState, useRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/shared/ui/dialog";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/ui/tooltip";

type Props = {
  src: string;
  alt: string;
  className?: string;
  children: React.ReactNode;
};

export function ImageDialog({ src, alt, children }: Props) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });
  const [lastTouchDistance, setLastTouchDistance] =
    useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  };
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    if (!touch1 || !touch2) return 0;
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0];
      if (touch) {
        setIsDragging(true);
        setDragStart({
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        setZoom((prev) =>
          Math.max(0.25, Math.min(3, prev * scale))
        );
      }
      setLastTouchDistance(distance);
    } else if (
      e.touches.length === 1 &&
      isDragging &&
      zoom > 1
    ) {
      const touch = e.touches[0];
      if (touch) {
        setPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) =>
      Math.max(0.25, Math.min(3, prev * (1 + delta)))
    );
  };

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
        <div
          className="relative flex items-center justify-center h-full overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={`max-h-full max-w-full object-contain transition-transform duration-200 ${
              zoom > 1 ? "cursor-grab" : ""
            } ${isDragging ? "cursor-grabbing" : ""}`}
            style={{
              transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
              userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
          <div className="absolute bottom-4 left-4 flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                    disabled={zoom <= 0.25}
                  />
                }
              >
                <ZoomOut size={20} />
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={handleReset}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                  />
                }
              >
                <RotateCcw size={20} />
              </TooltipTrigger>
              <TooltipContent>Reset Zoom</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                    disabled={zoom >= 3}
                  />
                }
              >
                <ZoomIn size={20} />
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
