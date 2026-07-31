import React from "react";
import { Search, Filter } from "lucide-react";

export function DeliveryLogsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Delivery Logs & Analytics</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient..."
              className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00E5FF]/50"
            />
          </div>
          <button className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/5 border-b border-white/10 text-white">
            <tr>
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Recipient</th>
              <th className="px-6 py-4 font-medium">Channel (Provider)</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Idempotency Key</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">Just now</td>
              <td className="px-6 py-4 text-white">+91 9876543210</td>
              <td className="px-6 py-4">SMS (Twilio)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  Delivered
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs">camp_123_+919876543210</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">5 mins ago</td>
              <td className="px-6 py-4 text-white">test@example.com</td>
              <td className="px-6 py-4">Email (SMTP)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  Sent
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs">camp_124_test@example.com</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">1 hour ago</td>
              <td className="px-6 py-4 text-white">+91 9999999999</td>
              <td className="px-6 py-4">WhatsApp (Meta)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                  Failed
                </span>
                <p className="text-xs text-red-400/70 mt-1">Number not registered on WA</p>
              </td>
              <td className="px-6 py-4 font-mono text-xs">camp_123_+919999999999</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
