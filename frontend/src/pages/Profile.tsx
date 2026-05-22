import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Globe } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Avatar from "../components/ui/Avatar";
import PublicationGrid from "../components/publication/PublicationGrid";
import EditPublicationModal from "../components/publication/EditPublicationModal";
import { ProfileModal } from "../components/auth/ProfileModal";
import { useAuth } from "../context/AuthContext";
import { useUserPublications } from "../hooks/useUserPublications";
import api from "../lib/api";
import type { Publication } from "../types/models";

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [pubToEdit, setPubToEdit] = useState<Publication | null>(null);

  const queryKey = ["user-publications", user?.id] as const;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserPublications(user?.id);

  const queryClient = useQueryClient();

  const handleDelete = async (publicationId: string) => {
    await api.delete(`/api/publications/${publicationId}`);
    queryClient.invalidateQueries({ queryKey });
  };

  if (!user) return null;

  const websiteHref = user.website
    ? /^https?:\/\//i.test(user.website)
      ? user.website
      : `https://${user.website}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col xs:flex-row sm:flex-row items-start gap-4 sm:gap-5">
            <Avatar src={user.avatar_url} name={user.name} size={72} className="rounded-2xl" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1
                             text-xs font-medium text-gray-500 transition-colors
                             hover:border-red-300 hover:bg-red-50/40 hover:text-red-600"
                  title="Edit profile"
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
              {user.website && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 mt-2"
                >
                  <Globe size={14} />
                  {user.website.replace(/^https?:\/\//i, "")}
                </a>
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

      <ProfileModal mode="edit" isOpen={editing} onClose={() => setEditing(false)} />
      <EditPublicationModal publication={pubToEdit} isOpen={Boolean(pubToEdit)} onClose={() => setPubToEdit(null)} />
    </div>
  );
}
