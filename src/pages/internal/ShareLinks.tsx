import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  shareLinkService,
  type ShareLinkAnalytics,
} from '@/services/shareLinkService';
import { FUNNEL_STEPS, type FunnelEventName } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Check,
  Copy,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  buildShareUrl,
  generateTrackingId,
  isValidTrackingId,
} from '@/utils/trackingId';

const STEP_LABELS: Record<FunnelEventName, string> = {
  page_view: 'Page views',
  chat_started: 'Chats started',
  message_sent: 'Messages',
  conversation_complete: 'Completed chat',
  email_capture_shown: 'Email form shown',
  email_capture_submitted: 'Waitlist signup',
};

const ShareLinks: React.FC = () => {
  const { isInternal, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rows, setRows] = useState<ShareLinkAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [customId, setCustomId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isInternal) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have access to this page.',
        variant: 'destructive',
      });
    }
  }, [authLoading, isInternal, navigate, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shareLinkService.getAnalytics();
      setRows(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load share link analytics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isInternal) load();
  }, [isInternal, load]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyLink = async (trackingId: string) => {
    const url = buildShareUrl(trackingId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(trackingId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Copied', description: 'Share link copied to clipboard.' });
    } catch {
      toast({
        title: 'Copy failed',
        description: url,
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async () => {
    const id = customId.trim() || generateTrackingId();
    if (!isValidTrackingId(id)) {
      toast({
        title: 'Invalid ID',
        description: 'Use 1–64 characters: letters, numbers, hyphens, underscores.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await shareLinkService.createLink({
        id,
        label: label.trim() || null,
        notes: notes.trim() || null,
      });
      toast({ title: 'Link created', description: `Tracking ID: ${id}` });
      setCreateOpen(false);
      setLabel('');
      setCustomId('');
      setNotes('');
      await load();
      await copyLink(id);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not create link.';
      toast({
        title: 'Create failed',
        description: message.includes('duplicate')
          ? 'That ID is already in use.'
          : message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trackingId: string) => {
    if (!window.confirm(`Remove registered link "${trackingId}"? Visits are kept.`)) {
      return;
    }
    try {
      await shareLinkService.deleteLink(trackingId);
      toast({ title: 'Removed', description: 'Link removed from registry.' });
      load();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete link.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple" />
      </div>
    );
  }

  if (!isInternal) return null;

  const openedCount = rows.filter((r) => r.opened).length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Link to="/internal">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Internal
                </Button>
              </Link>
              <Link2 className="h-5 w-5 text-therapy-purple" />
              <span className="font-semibold text-gray-800">Share Links</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                className="bg-therapy-purple hover:bg-therapy-purple/90"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New link
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription>Tracked IDs</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-therapy-purple">{rows.length}</p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription>Opened at least once</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-green-600">{openedCount}</p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription>Usage</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Send <code className="text-xs bg-gray-100 px-1 rounded">/?id=your-id</code> on
                  any landing page. Unregistered IDs still appear here once opened.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle>Link tracking</CardTitle>
              <CardDescription>
                See who opened personalized links and how far they went in the funnel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No links yet. Create one or send a URL with <code>?id=...</code>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name / ID</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead>First open</TableHead>
                        <TableHead>Last open</TableHead>
                        <TableHead>Funnel</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.trackingId}>
                          <TableCell>
                            <div className="font-medium text-gray-800">
                              {row.label ?? (
                                <span className="text-gray-400 italic">Unlabeled</span>
                              )}
                            </div>
                            <div className="font-mono text-xs text-gray-500">
                              {row.trackingId}
                            </div>
                            {!row.isRegistered && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Ad-hoc
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.opened ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-400">
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.visitCount}
                            {row.uniqueSessions > 0 && (
                              <span className="text-xs text-gray-400 block">
                                {row.uniqueSessions} session
                                {row.uniqueSessions === 1 ? '' : 's'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(row.firstOpenedAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(row.lastOpenedAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {FUNNEL_STEPS.filter(
                                (step) => (row.funnelCounts[step] ?? 0) > 0,
                              ).map((step) => (
                                <Badge
                                  key={step}
                                  variant="secondary"
                                  className="text-xs font-normal"
                                  title={STEP_LABELS[step]}
                                >
                                  {STEP_LABELS[step]}: {row.funnelCounts[step]}
                                </Badge>
                              ))}
                              {FUNNEL_STEPS.every(
                                (step) => (row.funnelCounts[step] ?? 0) === 0,
                              ) && (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyLink(row.trackingId)}
                                title="Copy share URL"
                              >
                                {copiedId === row.trackingId ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              {row.isRegistered && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDelete(row.trackingId)}
                                  title="Remove from registry"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create share link</DialogTitle>
            <DialogDescription>
              Assign a name and optional custom ID. Leave ID blank to auto-generate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="share-label">Person / label</Label>
              <Input
                id="share-label"
                placeholder="e.g. Jane Smith"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-id">Custom ID (optional)</Label>
              <Input
                id="share-id"
                placeholder="Auto-generated if empty"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-notes">Notes (optional)</Label>
              <Input
                id="share-notes"
                placeholder="Internal notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-therapy-purple hover:bg-therapy-purple/90"
            >
              {saving ? 'Creating…' : 'Create & copy link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareLinks;
