import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">Store settings</p>
        <p className="text-sm mt-1">Configure your store preferences, payments, and shipping here.</p>
      </div>
    </div>
  );
}
