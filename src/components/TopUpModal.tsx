import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

import { toast } from "@/components/ui/sonner";
import { Smartphone, Loader2 } from "lucide-react";

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const tokens = parseInt(amount) || 0;

  const handlePayment = async () => {
    if (tokens < 1) {
      toast.error("Enter a valid amount (minimum KES 1)");
      return;
    }
    setLoading(true);
    setStatus("pending");

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone_number: profile?.phone_number,
          amount: tokens,
          tokens_from_amount: tokens
        })
      });

      if (response.ok) {
        setStatus("success");
        toast.success("Payment successful! Tokens have been added to your balance.");
        await refreshProfile();
        setTimeout(() => {
          onOpenChange(false);
          setStatus("idle");
          setAmount("");
        }, 2000);
      } else {
        const err = await response.json();
        throw new Error(err.detail || "Payment failed");
      }
    } catch (err: any) {
      setStatus("error");
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [50, 100, 500, 1000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy SMS Tokens</DialogTitle>
          <DialogDescription>
            Pay via M-Pesa. 1 KES = 1 SMS token. Prompt will be sent to {profile?.phone_number}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((a) => (
              <Button
                key={a}
                variant={amount === String(a) ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(String(a))}
              >
                {a}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Amount (KES)</Label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          {tokens > 0 && (
            <div className="rounded-lg bg-accent p-3 text-sm">
              <p className="font-medium text-accent-foreground">
                You'll receive <span className="text-primary font-bold tabular-nums">{tokens}</span> SMS tokens
              </p>
            </div>
          )}

          {status === "pending" && (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Smartphone className="h-5 w-5 text-primary animate-pulse" />
              <p className="text-sm">Check your phone for the M-Pesa prompt...</p>
            </div>
          )}

          <Button onClick={handlePayment} disabled={loading || tokens < 1} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay KES ${tokens || 0} via M-Pesa`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
