import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TopUpModal } from "@/components/TopUpModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { Coins, Send, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { profile, user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [paymentsRes, messagesRes] = await Promise.all([
          fetch('/api/payments', { headers }),
          fetch('/api/messages', { headers })
        ]);

        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.slice(0, 5));
        }

        if (messagesRes.ok) {
          const data = await messagesRes.json();
          setMessages(data.slice(0, 5));
          setTotalSent(data.length);
          const totalUsed = data.reduce((sum: number, m: any) => sum + (m.token_cost || 0), 0);
          setTotalTokensUsed(totalUsed);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [user]);

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: "bg-info text-info-foreground",
      delivered: "bg-success text-success-foreground",
      failed: "bg-destructive text-destructive-foreground",
      pending: "bg-warning text-warning-foreground",
      completed: "bg-success text-success-foreground",
    };
    return (
      <Badge className={variants[status] || "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Dashboard" onTopUp={() => setTopUpOpen(true)}>
      <div className="space-y-6">
        {}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Token Balance</CardTitle>
              <Coins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold tabular-nums ${(profile?.sms_token_balance ?? 0) < 10 ? "text-destructive" : "text-primary"}`}>
                {profile?.sms_token_balance ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">SMS tokens available</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total SMS Sent</CardTitle>
              <Send className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{totalSent}</p>
              <p className="text-xs text-muted-foreground mt-1">Messages dispatched</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{totalTokensUsed}</p>
              <p className="text-xs text-muted-foreground mt-1">Total tokens spent</p>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Payments</h2>
            <Button variant="ghost" className="text-sm" size="sm" onClick={() => (window.location.href = '/payments')}>View All</Button>
          </div>
          {payments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No payments yet. Top up to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {payments.map((p) => (
                <Card key={p.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <div className={`h-1.5 ${p.status === 'completed' ? 'bg-success' : 'bg-warning'}`} />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount</span>
                        <span className="text-lg font-bold">KES {p.amount}</span>
                      </div>
                      {statusBadge(p.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Tokens</span>
                        <span className="font-medium text-primary">{p.tokens_added} TK</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Ref</span>
                        <span className="font-mono text-[10px] truncate">{p.mpesa_transaction_code || "Processing"}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-[10px] text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Messages</h2>
            <Button variant="ghost" className="text-sm" size="sm" onClick={() => (window.location.href = '/messages')}>View All</Button>
          </div>
          {messages.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No messages sent yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {messages.map((m) => (
                <Card key={m.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <div className={`h-1.5 ${m.status === 'sent' ? 'bg-info' : m.status === 'delivered' ? 'bg-success' : 'bg-destructive'}`} />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recipient</span>
                        <span className="font-mono text-sm">{m.recipient_phone}</span>
                      </div>
                      {statusBadge(m.status)}
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-xs italic mb-3 line-clamp-2 min-h-[40px]">
                      "{m.message_content}"
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Cost</span>
                        <span className="font-medium text-primary">{m.token_cost || 0} TK</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          <Clock className="mr-1 h-2 w-2" />
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </DashboardLayout>
  );
}
