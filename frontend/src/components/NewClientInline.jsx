import { useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Button, Input, useToast } from "./ui";
import { readError } from "../lib/api";

export function NewClientInline({
  apiBase,
  token,
  canCancel,
  onCreated,
  onCancel,
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const valid = name.trim() !== "" && email.trim() !== "";

  const save = async () => {
    if (!valid || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone_number: phone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        // For example the phone format message from the API
        setError(await readError(res, "Couldn't save the client."));
        return;
      }
      const body = await res.json().catch(() => null);
      const id = body?.client?.id ?? body?.data?.id ?? body?.id ?? null;
      toast.success(`Client ${name.trim()} added`);
      onCreated({ id, email: email.trim().toLowerCase() });
    } catch {
      setError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const onEnter = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault(); // don't submit the invoice behind this
    save();
  };

  return (
    <div className="space-y-3 rounded-xl border border-accent/30 bg-accent-soft/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <UserPlus className="h-4 w-4 text-accent" aria-hidden />
          New client
        </p>
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Cancel
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Acme Corporation"
          autoComplete="organization"
          autoFocus
        />
        <Input
          label="Billing email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onEnter}
          placeholder="billing@acme.co"
          autoComplete="email"
        />
        <Input
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={onEnter}
          placeholder="+12015551234"
          autoComplete="tel"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button onClick={save} loading={saving} disabled={!valid}>
        Add client
      </Button>
    </div>
  );
}
