import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface ProgressDialogProps {
  open: boolean;
  title: string;
  steps: ProgressStep[];
  currentStepIndex: number;
  overallProgress: number; // 0-100
}

export function ProgressDialog({
  open,
  title,
  steps,
  currentStepIndex,
  overallProgress,
}: ProgressDialogProps) {
  const currentStep = steps[currentStepIndex];
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Current Step Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {currentStep?.label || 'Processing...'}
              </span>
              <span className="font-medium text-foreground">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = step.status === 'completed';
              const isPending = step.status === 'pending';
              const isError = step.status === 'error';

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    isActive && "bg-primary/10",
                    isCompleted && "bg-green-500/10",
                    isError && "bg-destructive/10"
                  )}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : isError ? (
                      <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      "text-sm flex-1",
                      isActive && "font-medium text-foreground",
                      isCompleted && "text-green-600 dark:text-green-400",
                      isError && "text-destructive",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
