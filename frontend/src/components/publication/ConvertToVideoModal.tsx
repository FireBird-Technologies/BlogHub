import { Video, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { blog2videoUrl } from "../../lib/blog2video";

interface ConvertToVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConvertToVideoModal({ isOpen, onClose }: ConvertToVideoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert to video" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
          <Video size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600 max-w-sm">
          Convert your posts into videos
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <a href={blog2videoUrl("popup")} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button className="w-full justify-center">
              Convert to video
              <ExternalLink size={14} className="opacity-80" />
            </Button>
          </a>
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto justify-center">
            Not now
          </Button>
        </div>
      </div>
    </Modal>
  );
}
