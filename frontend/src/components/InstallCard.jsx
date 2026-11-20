import { CheckCircle2, Download, Share } from "lucide-react";
import { Badge, Button, Card, CardHeader, useToast } from "./ui";
import { useInstall } from "../hooks/useInstall";
import { promptInstall } from "../lib/pwa";

export function InstallCard() {
  const toast = useToast();
  const { canInstall, installed, ios } = useInstall();

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted")
      toast.success("LedgerFlow is being added to your device");
  };

  return (
    <Card>
      <CardHeader
        title="Install the app"
        description="Open LedgerFlow from your home screen, full screen, like any other app."
        action={installed ? <Badge tone="success">Installed</Badge> : undefined}
      />
      <div className="p-5">
        {installed ? (
          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            LedgerFlow is installed on this device.
          </p>
        ) : canInstall ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-fg-muted">
              Get a home screen icon, a full-screen window, and quick shortcuts
              for New invoice and Add client.
            </p>
            <Button onClick={install}>
              <Download className="h-4 w-4" aria-hidden />
              Install app
            </Button>
          </div>
        ) : ios ? (
          <ol className="space-y-2 text-sm text-fg-muted">
            <li>
              1. In Safari, tap the Share button{" "}
              <Share className="inline h-4 w-4 align-text-bottom" aria-hidden />
            </li>
            <li>2. Choose Add to Home Screen.</li>
            <li>3. Tap Add. LedgerFlow now opens like an app.</li>
          </ol>
        ) : (
          <p className="text-sm text-fg-muted">
            Your browser hasn't offered an install prompt. In Chrome or Edge,
            look for the install icon in the address bar, or open the browser
            menu and choose Install LedgerFlow. Installing only works on the
            live site.
          </p>
        )}
      </div>
    </Card>
  );
}
