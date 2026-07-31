import React from "react";
import { ShieldAlert, Plus } from "lucide-react";

export function ProvidersTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Provider Settings & Failover</h2>
        <button className="bg-[#00E5FF] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00E5FF]/90 flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Provider Config
        </button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-200/90">
          <p className="font-medium text-yellow-400 mb-1">Secrets Management</p>
          <p>
            For security, API keys and secrets are NOT stored in the database. They are managed via
            the secure Secrets Provider (`.env` / KMS). You only need to configure rate limits and
            priorities here.
          </p>
        </div>
      </div>

      <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/5 border-b border-white/10 text-white">
            <tr>
              <th className="px-6 py-4 font-medium">Provider Name</th>
              <th className="px-6 py-4 font-medium">Channel</th>
              <th className="px-6 py-4 font-medium">Priority (Failover)</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-white font-medium">Twilio</td>
              <td className="px-6 py-4">SMS</td>
              <td className="px-6 py-4">1 (Primary)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-[#00E5FF] hover:underline">Edit</button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-white font-medium">MSG91</td>
              <td className="px-6 py-4">SMS</td>
              <td className="px-6 py-4">2 (Fallback)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-[#00E5FF] hover:underline">Edit</button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-white font-medium">Meta WhatsApp Cloud</td>
              <td className="px-6 py-4">WhatsApp</td>
              <td className="px-6 py-4">1 (Primary)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-[#00E5FF] hover:underline">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
