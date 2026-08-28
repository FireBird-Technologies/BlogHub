import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Info } from "lucide-react";
import Modal from "../ui/Modal";
import AvatarPicker from "../ui/AvatarPicker";
import AdjustImageModal from "../ui/AdjustImageModal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import DeleteAccountModal from "./DeleteAccountModal";
import { useAuth } from "../../context/AuthContext";
import api, { formatApiErrorDetail } from "../../lib/api";
import type { User } from "../../types/models";

type Mode = "onboarding" | "edit";

interface ProfilePatch {
  name?: string;
  tag?: string;
  website?: string;
  avatar_url?: string;
  avatar_position?: string | null;
  avatar_scale?: number | null;
  onboarded?: boolean;
}

const inputClass =
  "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 " +
  "focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20";

function ProfileModalForm({ mode, user, onClose }: { mode: Mode; user: User; onClose: () => void }) {
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [tag, setTag] = useState(user.tag);
  const [website, setWebsite] = useState(user.website ?? "");
  const [avatar, setAvatar] = useState<string | null>(user.avatar_url);
  const [avatarPosition, setAvatarPosition] = useState<string | null>(user.avatar_position ?? null);
  const [avatarScale, setAvatarScale] = useState<number | null>(user.avatar_scale ?? null);
  const [adjustingAvatar, setAdjustingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onboarding = mode === "onboarding";

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (body: ProfilePatch) => api.patch<User>("/api/me", body).then((r) => r.data),
    onSuccess: (updated) => {
      setUser(updated);
      onClose();
    },
  });

  // Tag failures (taken / required / change cooldown) surface under the tag
  // input; anything else shows as a general message at the bottom.
  const errorStatus =
    isAxiosError(error) && error.response ? error.response.status : null;
  const tagError =
    errorStatus !== null && [400, 409, 429].includes(errorStatus)
      ? formatApiErrorDetail(error, "That tag is not available.")
      : null;
  const generalError =
    error != null && tagError == null
      ? formatApiErrorDetail(error, "Something went wrong. Please try again.")
      : null;

  const handleSave = () => {
    const body: ProfilePatch = {
      name: name.trim() || user.name,
      tag: tag.trim(),
      website: website.trim(),
    };
    const avatarChanged = avatar && avatar !== user.avatar_url;
    if (avatarChanged) body.avatar_url = avatar;
    // Persist the crop when the avatar changed or the user repositioned/zoomed an existing one.
    const cropChanged =
      avatarPosition !== (user.avatar_position ?? null) || avatarScale !== (user.avatar_scale ?? null);
    if (avatar && (avatarChanged || cropChanged)) {
      body.avatar_position = avatarPosition;
      body.avatar_scale = avatarScale;
    }
    if (onboarding) body.onboarded = true;
    mutate(body);
  };

  const handleSkip = () => mutate({ onboarded: true });

  const handleModalClose = () => {
    if (isPending) return;
    if (onboarding) handleSkip();
    else onClose();
  };

  return (
    <Modal
      isOpen
      onClose={handleModalClose}
      title={onboarding ? "Welcome to BlogHub" : "Edit Profile"}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center gap-5">
        {onboarding && (
          <p className="text-sm text-gray-500 text-center">
            Let's set up your profile. Review the details below or change them now.
          </p>
        )}

        <AvatarPicker
          src={avatar}
          name={name}
          size={96}
          position={avatarPosition}
          scale={avatarScale}
          onChange={(dataUrl) => {
            setAvatar(dataUrl);
            setAvatarPosition(null); // new photo → reset crop to center
            setAvatarScale(null);
          }}
        />
        {avatar && (
          <button
            type="button"
            onClick={() => setAdjustingAvatar(true)}
            className="text-xs font-medium text-gray-500 hover:text-red-600 underline -mt-2"
          >
            Adjust photo crop &amp; zoom
          </button>
        )}
        {avatar && (
          <AdjustImageModal
            src={avatar}
            isOpen={adjustingAvatar}
            position={avatarPosition}
            scale={avatarScale}
            aspect={1}
            rounded
            onClose={() => setAdjustingAvatar(false)}
            onSave={(pos, sc) => {
              setAvatarPosition(pos);
              setAvatarScale(sc);
            }}
          />
        )}

        <div className="w-full flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tag</label>
            <div
              className={`flex items-center w-full bg-white border rounded-lg ${
                tagError
                  ? "border-red-400 ring-1 ring-red-400/30"
                  : "border-gray-200 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400/20"
              }`}
            >
              <span className="pl-3 text-sm text-gray-400 select-none">@</span>
              <input
                type="text"
                value={tag}
                onChange={(e) => {
                  if (error) reset();
                  setTag(e.target.value.replace(/^@+/, "").replace(/\s/g, "").toLowerCase());
                }}
                placeholder="yourtag"
                maxLength={64}
                className="flex-1 bg-transparent px-1.5 py-2 text-sm text-gray-900 focus:outline-none"
              />
            </div>
            {tagError ? (
              <p className="mt-1 text-xs text-red-600">{tagError}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                Your unique handle — shown as{" "}
                <span className="text-gray-500">@{tag || "yourtag"}</span>.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Website <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-site.com"
              className={inputClass}
            />
          </div>
        </div>

        {onboarding && (
          <div className="w-full flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <Info size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500">
              You can change your name, photo, tag, and website anytime from your Profile page.
            </p>
          </div>
        )}

        {generalError && (
          <p className="text-sm text-red-600 text-center">{generalError}</p>
        )}

        <div className="w-full flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim() || !tag.trim()}
            className="w-full justify-center"
          >
            {isPending ? <Spinner size={14} /> : null} {onboarding ? "Get Started" : "Save Changes"}
          </Button>
          <Button
            variant="ghost"
            onClick={onboarding ? handleSkip : onClose}
            disabled={isPending}
            className="w-full justify-center"
          >
            {onboarding ? "Skip for now" : "Cancel"}
          </Button>
        </div>

        {/* Not offered during onboarding — there is nothing to delete yet. */}
        {!onboarding && (
          <div className="w-full border-t border-gray-100 pt-4">
            <p className="mt-1 text-xs text-gray-400">
              Deleting your account permanently removes your publications, comments
              and upvotes.
            </p>
            <button
              type="button"
              onClick={() => setDeleting(true)}
              disabled={isPending}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 underline
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete my account
            </button>
          </div>
        )}

        <DeleteAccountModal isOpen={deleting} onClose={() => setDeleting(false)} />
      </div>
    </Modal>
  );
}

/** Profile form modal — drives both first-time onboarding and later profile edits. */
export function ProfileModal({
  mode,
  isOpen,
  onClose,
}: {
  mode: Mode;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  if (!isOpen || !user) return null;
  // Keying on a fresh mount lets the form initialise its state from the current user.
  return <ProfileModalForm mode={mode} user={user} onClose={onClose} />;
}

/** Global wrapper: shows the onboarding variant once, for users who haven't onboarded. */
export function OnboardingModal() {
  const { user, loading } = useAuth();
  return (
    <ProfileModal
      mode="onboarding"
      isOpen={!loading && !!user && !user.onboarded}
      onClose={() => {}}
    />
  );
}
