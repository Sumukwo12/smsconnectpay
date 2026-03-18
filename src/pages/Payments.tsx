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

export default function Payments() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('/api/payments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPayments(data || []);
          setTotal(data.length);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };
    fetchPayments();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      completed: "bg-success text-success-foreground",
      failed: "bg-destructive text-destructive-foreground",
    };
    return <Badge className={variants[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  return (
    <DashboardLayout title="Payment History" onTopUp={() => setTopUpOpen(true)}>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">All Payments ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payments yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Amount (KES)</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>M-Pesa Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {new Date(p.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.phone_number}</TableCell>
                      <TableCell className="tabular-nums font-medium">{p.amount}</TableCell>
                      <TableCell className="tabular-nums">{p.tokens_added}</TableCell>
                      <TableCell className="font-mono text-xs">{p.mpesa_transaction_code}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
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
