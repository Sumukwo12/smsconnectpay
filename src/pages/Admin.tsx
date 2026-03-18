import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

import { ChevronLeft, ChevronRight, Users, CreditCard, MessageSquare, Coins } from "lucide-react";

const PAGE_SIZE = 10;

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [messagesPage, setMessagesPage] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [messagesTotal, setMessagesTotal] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminData = async () => {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [usersRes, paymentsRes, messagesRes] = await Promise.all([
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/payments', { headers }),
          fetch('/api/admin/messages', { headers })
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data);
          setUsersTotal(data.length);
        }
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data);
          setPaymentsTotal(data.length);
        }
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          setMessages(data);
          setMessagesTotal(data.length);
        }
      } catch (e) {
        console.error("Admin fetch error:", e);
      }
    };
    fetchAdminData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <DashboardLayout title="Admin Panel">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: "bg-info text-info-foreground",
      delivered: "bg-success text-success-foreground",
      failed: "bg-destructive text-destructive-foreground",
      pending: "bg-warning text-warning-foreground",
      completed: "bg-success text-success-foreground",
    };
    return <Badge className={variants[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  const Paginator = ({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) => {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages || 1}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Admin Panel">
      <div className="space-y-6">
        {}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{usersTotal}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{paymentsTotal}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{messagesTotal}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
              <Coins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {users.reduce((sum, u) => sum + (u.sms_token_balance || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="font-mono text-xs">{u.phone_number}</TableCell>
                        <TableCell className="tabular-nums">{u.sms_token_balance}</TableCell>
                        <TableCell className="tabular-nums">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Paginator page={usersPage} setPage={setUsersPage} total={usersTotal} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>M-Pesa Code</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="tabular-nums">{new Date(p.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{p.phone_number}</TableCell>
                        <TableCell className="tabular-nums font-medium">{p.amount}</TableCell>
                        <TableCell className="tabular-nums">{p.tokens_added}</TableCell>
                        <TableCell className="font-mono text-xs">{p.mpesa_transaction_code}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Paginator page={paymentsPage} setPage={setPaymentsPage} total={paymentsTotal} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
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
                        <TableCell className="tabular-nums">{new Date(m.created_at).toLocaleString()}</TableCell>
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
                <Paginator page={messagesPage} setPage={setMessagesPage} total={messagesTotal} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
