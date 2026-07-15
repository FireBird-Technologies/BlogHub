import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import api, { formatApiErrorDetail } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { LEGAL } from "../../constants/legal";

interface SupportVars {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Contact form for the featured slot — sends the message to the site owner by email. */
export default function ContactSupportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Prefill from the signed-in user, and reset on each open so a previous send
  // doesn't leave the form in a stale state.
  useEffect(() => {
    if (isOpen) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setSubject("");
      setMessage("");
      setError(null);
      setSent(false);
    }
  }, [isOpen, user]);

  const send = useMutation<void, Error, SupportVars>({
    mutationFn: (vars) => api.post("/api/featured/support", vars).then(() => undefined),
    onSuccess: () => setSent(true),
    onError: (err) =>
      setError(
        formatApiErrorDetail(err, "Could not send your message. Please email us directly."),
      ),
  });

  const canSend = email.trim() && subject.trim() && message.trim() && !send.isPending;

  const handleSend = () => {
    setError(null);
    send.mutate({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
  };

  const field =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 " +
    "focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact support" maxWidth="max-w-lg">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-base font-semibold text-gray-900">Message sent</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Thanks — we&apos;ve got your message and will reply to{" "}
            <span className="font-medium text-gray-700">{email}</span> as soon as we can.
          </p>
          <Button variant="ghost" size="sm" onClick={onClose} className="mt-2">
            Close
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Questions about featuring your publication? Send us a message and we&apos;ll get back to
            you. You can also email{" "}
            <a
              href={`mailto:${LEGAL.contactEmail}`}
              className="text-red-600 underline hover:text-red-700"
            >
              {LEGAL.contactEmail}
            </a>
            .
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">Name</span>
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">
                Email <span className="text-red-500">*</span>
              </span>
              <input
                className={field}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-600">
              Subject <span className="text-red-500">*</span>
            </span>
            <input
              className={field}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              maxLength={150}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-600">
              Message <span className="text-red-500">*</span>
            </span>
            <textarea
              className={`${field} resize-y min-h-[120px]`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us how we can help…"
              maxLength={4000}
              required
            />
            <span className="text-[11px] text-gray-400 self-end">{message.length}/4000</span>
          </label>

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={send.isPending}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSend} disabled={!canSend}>
              {send.isPending ? (
                <>
                  <Spinner size={14} /> Sending…
                </>
              ) : (
                "Send message"
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
