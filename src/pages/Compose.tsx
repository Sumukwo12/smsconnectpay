import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TopUpModal } from "@/components/TopUpModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

import { toast } from "@/components/ui/sonner";
import { Upload, Plus, X, Send, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return /^(?:\+254|0)[17]\d{8}$/.test(cleaned);
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("0")) return "+254" + cleaned.slice(1);
  if (cleaned.startsWith("254")) return "+" + cleaned;
  return cleaned;
}

export default function Compose() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { profile, user, refreshProfile } = useAuth();
  const [message, setMessage] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [phones, setPhones] = useState<string[]>([]);
  const [invalidPhones, setInvalidPhones] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const charCount = message.length;
  const smsCount = charCount === 0 ? 0 : Math.ceil(charCount / 160);
  const totalCost = smsCount * phones.length;
  const balance = profile?.sms_token_balance ?? 0;
  const canSend = phones.length > 0 && message.trim().length > 0 && totalCost <= balance;

  const addPhone = () => {
    const cleaned = manualPhone.trim();
    if (!cleaned) return;
    if (!validatePhone(cleaned)) {
      toast.error("Invalid Kenyan phone number");
      return;
    }
    const normalized = normalizePhone(cleaned);
    if (phones.includes(normalized)) {
      toast.error("Phone number already added");
      return;
    }
    setPhones([...phones, normalized]);
    setManualPhone("");
  };

  const removePhone = (phone: string) => {
    setPhones(phones.filter((p) => p !== phone));
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target?.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

      const valid: string[] = [];
      const invalid: string[] = [];

      data.flat().forEach((cell: any) => {
        const str = String(cell).trim();
        if (!str || str === "undefined") return;
        if (validatePhone(str)) {
          const normalized = normalizePhone(str);
          if (!valid.includes(normalized)) valid.push(normalized);
        } else {
          invalid.push(str);
        }
      });

      setPhones((prev) => {
        const combined = [...new Set([...prev, ...valid])];
        return combined;
      });
      setInvalidPhones(invalid);

      toast.success(`${valid.length} valid numbers imported${invalid.length > 0 ? `, ${invalid.length} invalid skipped` : ""}`);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }, []);

  const handleSend = async () => {
    if (!canSend || !user) return;
    setSending(true);
    setProgress(0);

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          recipient_phones: phones,
          message_content: message,
        }),
      });

      if (response.ok) {
        await refreshProfile();
        toast.success(`${phones.length} messages sent successfully!`);
        setPhones([]);
        setMessage("");
        setInvalidPhones([]);
      } else {
        const err = await response.json();
        toast.error(err.detail || "Failed to send messages");
      }
    } catch (err: any) {
      toast.error("Network error. Is the backend running?");
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  return (
    <DashboardLayout title="Compose SMS" onTopUp={() => setTopUpOpen(true)}>
      <div className="max-w-3xl mx-auto space-y-6">
        {}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="mb-4">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Excel Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <div className="flex gap-2">
                  <Input
                    placeholder="0712345678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhone())}
                  />
                  <Button onClick={addPhone} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload Excel/CSV file with phone numbers</p>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </TabsContent>
            </Tabs>

            {}
            {phones.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{phones.length} recipient{phones.length > 1 ? "s" : ""}</p>
                  <Button variant="ghost" size="sm" onClick={() => setPhones([])}>
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {phones.map((p) => (
                    <Badge key={p} variant="secondary" className="gap-1 font-mono text-xs">
                      {p}
                      <button onClick={() => removePhone(p)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {invalidPhones.length > 0 && (
              <div className="mt-3 rounded-lg bg-destructive/10 p-3">
                <p className="text-xs font-medium text-destructive mb-1">{invalidPhones.length} invalid numbers skipped:</p>
                <p className="text-xs text-destructive/80 font-mono">{invalidPhones.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{charCount} characters · {smsCount} SMS per recipient</span>
              <span className="font-medium">
                Total cost: <span className={`tabular-nums ${totalCost > balance ? "text-destructive" : "text-primary"}`}>{totalCost} tokens</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Balance: <span className="font-semibold tabular-nums text-foreground">{balance}</span> tokens
          </p>
          <Button onClick={handleSend} disabled={!canSend || sending} size="lg">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {phones.length} recipient{phones.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>

        {totalCost > balance && phones.length > 0 && message.length > 0 && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            Insufficient tokens. You need {totalCost - balance} more tokens.{" "}
            <button onClick={() => setTopUpOpen(true)} className="underline font-medium">
              Top up now
            </button>
          </div>
        )}
      </div>
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </DashboardLayout>
  );
}
