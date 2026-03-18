import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TopUpModal } from "@/components/TopUpModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export default function MessageHistory() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data || []);
          setTotal(data.length);
        }
      } catch (error) {
        console.error("Error fetching message history:", error);
      }
    };
    fetchMessages();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: "bg-info text-info-foreground",
      delivered: "bg-success text-success-foreground",
      failed: "bg-destructive text-destructive-foreground",
      pending: "bg-warning text-warning-foreground",
    };
    return <Badge className={variants[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  return (
    <DashboardLayout title="Message History" onTopUp={() => setTopUpOpen(true)}>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">All Messages ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No messages sent yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{m.recipient_phone}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{m.message_content}</TableCell>
                      <TableCell className="tabular-nums font-medium text-primary">
                        {m.token_cost || 0} <span className="text-[10px] text-muted-foreground ml-0.5">TK</span>
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </DashboardLayout>
  );
}
