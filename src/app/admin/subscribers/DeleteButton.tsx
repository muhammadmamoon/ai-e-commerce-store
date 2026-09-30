"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function DeleteButton({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${email} from the list? They will no longer receive emails.`,
      )
    )
      return;

    setLoading(true);
    try {
      await axios.delete(`/api/newsletter/${id}`);
      router.refresh(); // Refresh page to show updated list
    } catch (error) {
      alert("Failed to remove subscriber.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition disabled:opacity-50"
      title="Remove Subscriber"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
