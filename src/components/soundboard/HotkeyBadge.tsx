import { cn } from '@/lib/utils';

interface HotkeyBadgeProps {
  hotkey: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function HotkeyBadge({ hotkey, className, size = 'md' }: HotkeyBadgeProps) {
  const keys = hotkey.split('+');
  
  return (
    <div className={cn(
      "hotkey-badge",
      size === 'sm' && "px-1.5 py-0.5 text-[10px]",
      className
    )}>
      {keys.map((key, index) => (
        <span key={key} className="flex items-center gap-1">
          {index > 0 && <span className="text-muted-foreground">+</span>}
          <span className={cn(
            "hotkey-key",
            size === 'sm' && "min-w-[1.25rem] h-4 text-[9px]"
          )}>
            {key}
          </span>
        </span>
      ))}
    </div>
  );
}
