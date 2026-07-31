import React, { useState } from "react";
import { Mail, MessageSquare, Megaphone, Settings, ListTree } from "lucide-react";
import { CampaignsTab } from "./CampaignsTab";
import { TemplatesTab } from "./TemplatesTab";
import { ProvidersTab } from "./ProvidersTab";
import { DeliveryLogsTab } from "./DeliveryLogsTab";

export function CommunicationDashboard() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates" | "providers" | "logs">(
    "campaigns",
  );

  const tabs = [
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "templates", label: "Templates", icon: MessageSquare },
    { id: "providers", label: "Providers & Failover", icon: Settings },
    { id: "logs", label: "Delivery Logs", icon: ListTree },
  ];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "campaigns" | "templates" | "providers" | "logs")
              }
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                isActive
                  ? "border-[#00E5FF] text-[#00E5FF]"
                  : "border-transparent text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 min-h-[500px]">
        {activeTab === "campaigns" && <CampaignsTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "providers" && <ProvidersTab />}
        {activeTab === "logs" && <DeliveryLogsTab />}
      </div>
    </div>
  );
}
