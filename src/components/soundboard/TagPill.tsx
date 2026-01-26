import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TagPillProps {
  tag: string;
  className?: string;
  onRemove?: () => void;
  isActive?: boolean;
  onClick?: () => void;
}

export function TagPill({ tag, className, onRemove, isActive, onClick }: TagPillProps) {
  return (
    <span 
      className={cn(
        "tag-pill cursor-pointer transition-colors",
        isActive && "bg-primary text-primary-foreground",
        onClick && "hover:bg-primary/20",
        className
      )}
      onClick={onClick}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-destructive transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
