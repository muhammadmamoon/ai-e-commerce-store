import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import prisma from "../../../lib/prisma";
import { Mail, Calendar, Users } from "lucide-react";
import DeleteButton from "./DeleteButton"; // Naya delete button

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)
  ) {
    redirect("/login");
  }

  // Database se fetch karein
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header aligned with Dark Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage users who opted in for email notifications.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg font-bold text-sm">
          <Users className="w-4 h-4" />
          {subscribers.length} Active Subscribers
        </div>
      </div>

      {/* Dark Theme Table UI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
            <thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Email Address</th>
                <th className="px-6 py-4 font-semibold">Subscribed Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {subscribers.length > 0 ? (
                subscribers.map((sub, index) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </div>
                        <Mail className="w-4 h-4 text-slate-500" />
                        {sub.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-50" />
                        {new Date(sub.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Delete / Cancel Subscription Button */}
                      <DeleteButton id={sub.id} email={sub.email} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No subscribers found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
