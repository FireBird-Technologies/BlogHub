import { BookOpen } from "lucide-react";
import Button from "../ui/Button";

interface EmptyStateProps {
  onSubmit?: () => void;
  title?: string;
  description?: string;
}

export default function EmptyState({
  onSubmit,
  title = "No publications found",
  description = "Try adjusting your filters or be the first to share something.",
}: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <BookOpen size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-gray-700 font-medium">{title}</p>
        {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      </div>
      {onSubmit && (
        <Button variant="ghost" onClick={onSubmit}>
          Submit a publication
        </Button>
      )}
    </div>
  );
}
