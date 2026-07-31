import React from "react";
import { Plus } from "lucide-react";

export function TemplatesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Message Templates</h2>
        <button className="bg-[#00E5FF] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00E5FF]/90 flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/5 border-b border-white/10 text-white">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Variables</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-white">EMI Reminder 1 (DPD 0)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  WhatsApp
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs">
                {{ customer_name }}, {{ emi_amount }}
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-[#00E5FF] hover:underline">Edit</button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-white">Overdue Warning (DPD 7)</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                  SMS
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs">
                {{ customer_name }}, {{ branch_name }}
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
