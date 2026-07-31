import React from "react";
import { Plus, Play } from "lucide-react";

export function CampaignsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Active Campaigns</h2>
        <button className="bg-[#00E5FF] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00E5FF]/90 flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Analytics Summary */}
        <div className="bg-zinc-800/50 p-4 rounded-lg border border-white/5">
          <p className="text-sm text-zinc-400">Total Sent (30d)</p>
          <p className="text-2xl font-semibold text-white mt-1">124,500</p>
        </div>
        <div className="bg-zinc-800/50 p-4 rounded-lg border border-white/5">
          <p className="text-sm text-zinc-400">Delivery Rate</p>
          <p className="text-2xl font-semibold text-[#00E5FF] mt-1">98.2%</p>
        </div>
        <div className="bg-zinc-800/50 p-4 rounded-lg border border-white/5">
          <p className="text-sm text-zinc-400">Failed / Dead Letters</p>
          <p className="text-2xl font-semibold text-red-400 mt-1">1,432</p>
        </div>
      </div>

      <div className="bg-black/20 rounded-lg border border-white/5 p-8 text-center">
        <Play className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-1">No Active Campaigns</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Start a new SMS, WhatsApp, or Email campaign to engage your customers.
        </p>
        <button className="text-[#00E5FF] hover:underline text-sm font-medium">
          Create your first campaign
        </button>
      </div>
    </div>
  );
}
