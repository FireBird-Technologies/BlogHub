import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, Check, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import PublicationGrid from "../components/publication/PublicationGrid";
import EditPublicationModal from "../components/publication/EditPublicationModal";
import { useAuth } from "../context/AuthContext";
import { useUserPublications } from "../hooks/useUserPublications";
import api from "../lib/api";
import type { Publication, User } from "../types/models";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? "", bio: user?.bio ?? "" });
  const [pubToEdit, setPubToEdit] = useState<Publication | null>(null);

  const queryKey = ["user-publications", user?.id] as const;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserPublications(user?.id);

  const queryClient = useQueryClient();

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (body: { name?: string; bio?: string }) => api.patch<User>("/api/me", body).then((r) => r.data),
    onSuccess: (updated) => {
      setUser(updated);
      setEditing(false);
    },
  });

  const handleDelete = async (publicationId: string) => {
    await api.delete(`/api/publications/${publicationId}`);
    queryClient.invalidateQueries({ queryKey });
  };

  const handleSave = () =>
    saveProfile({ name: form.name.trim() || undefined, bio: form.bio.trim() || undefined });

  const handleCancel = () => {
    setForm({ name: user?.name ?? "", bio: user?.bio ?? "" });
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col xs:flex-row sm:flex-row items-start gap-4 sm:gap-5">
            <Avatar src={user.avatar_url} name={user.name} size={72} className="rounded-2xl" />

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2
                               focus:outline-none focus:border-red-400 max-w-xs"
                  />
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="A short bio…"
                    rows={2}
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2
                               focus:outline-none focus:border-red-400 resize-none max-w-md"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={isPending}>
                      {isPending ? <Spinner size={14} /> : <Check size={14} />} Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      <X size={14} /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{user.bio}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">My Publications</h2>
          <PublicationGrid
            pages={data?.pages}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            queryKey={queryKey}
            onDelete={handleDelete}
            onEdit={(p) => setPubToEdit(p)}
            isLoading={isLoading}
          />
        </div>
      </main>

      <EditPublicationModal publication={pubToEdit} isOpen={Boolean(pubToEdit)} onClose={() => setPubToEdit(null)} />
    </div>
  );
}
