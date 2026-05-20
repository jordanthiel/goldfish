import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@goldfish/shared/context/AuthContext';
import {
  shareLinkService,
  type ShareLinkAnalytics,
  type ShareLinkVisitor,
} from '@/services/shareLinkService';
import { FUNNEL_STEPS, type FunnelEventName } from '@/services/analyticsService';
import { Button } from '@goldfish/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@goldfish/shared/components/ui/card';
import { Input } from '@goldfish/shared/components/ui/input';
import { Label } from '@goldfish/shared/components/ui/label';
import { Badge } from '@goldfish/shared/components/ui/badge';
import { Skeleton } from '@goldfish/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@goldfish/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@goldfish/shared/components/ui/dialog';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@goldfish/shared/hooks/use-toast';
import { useInternalPageHeader } from '@/components/internal/InternalLayoutContext';
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
  const { isInternal } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<ShareLinkAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [customId, setCustomId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visitorsByLink, setVisitorsByLink] = useState<Record<string, ShareLinkVisitor[]>>({});
  const [visitorsLoadingId, setVisitorsLoadingId] = useState<string | null>(null);

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

  const visitorLabel = (visitor: ShareLinkVisitor) => {
    if (visitor.waitlistEmail) {
      return visitor.waitlistName
        ? `${visitor.waitlistName} (${visitor.waitlistEmail})`
        : visitor.waitlistEmail;
    }
    return `Visitor …${visitor.sessionId.slice(-10)}`;
  };

  const toggleVisitors = async (trackingId: string) => {
    if (expandedId === trackingId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(trackingId);
    if (visitorsByLink[trackingId]) return;

    setVisitorsLoadingId(trackingId);
    try {
      const visitors = await shareLinkService.getLinkVisitors(trackingId);
      setVisitorsByLink((prev) => ({ ...prev, [trackingId]: visitors }));
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load visitor activity for this link.',
        variant: 'destructive',
      });
      setExpandedId(null);
    } finally {
      setVisitorsLoadingId(null);
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

  useInternalPageHeader(
    {
      headerActions: (
        <>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            className="bg-therapy-purple hover:bg-therapy-purple/90 h-9"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New link
          </Button>
        </>
      ),
    },
    [loading, load],
  );

  if (!isInternal) return null;

  const openedCount = rows.filter((r) => r.opened).length;

  return (
    <>
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
                Each visitor is a browser session. Expand a link to see their full journey
                (page views, chat, waitlist) tied to that personalized URL.
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
                        <TableHead className="w-8" />
                        <TableHead>Name / ID</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Visitors</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead>First open</TableHead>
                        <TableHead>Last open</TableHead>
                        <TableHead>Funnel</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const isExpanded = expandedId === row.trackingId;
                        const visitors = visitorsByLink[row.trackingId];
                        const loadingVisitors = visitorsLoadingId === row.trackingId;

                        return (
                        <React.Fragment key={row.trackingId}>
                        <TableRow>
                          <TableCell className="w-8">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleVisitors(row.trackingId)}
                              disabled={!row.opened}
                              title={row.opened ? 'View visitors' : 'No activity yet'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
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
                            <span className="font-medium">{row.visitorCount}</span>
                          </TableCell>
                          <TableCell>
                            {row.visitCount}
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
                        {isExpanded && (
                          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                            <TableCell colSpan={9} className="p-0">
                              <div className="px-4 py-4 border-t border-gray-100">
                                {loadingVisitors ? (
                                  <div className="space-y-2 py-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                  </div>
                                ) : !visitors?.length ? (
                                  <p className="text-sm text-gray-500 py-4 text-center">
                                    No visitor activity recorded for this link yet.
                                  </p>
                                ) : (
                                  <div className="space-y-4">
                                    {visitors.map((visitor) => (
                                      <div
                                        key={visitor.sessionId}
                                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                      >
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                          <div>
                                            <p className="font-medium text-gray-800">
                                              {visitorLabel(visitor)}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                              {visitor.sessionId}
                                            </p>
                                          </div>
                                          <div className="text-right text-xs text-gray-500">
                                            <p>First: {formatDate(visitor.firstSeenAt)}</p>
                                            <p>Last: {formatDate(visitor.lastSeenAt)}</p>
                                          </div>
                                        </div>
                                        {visitor.landingPages.length > 0 && (
                                          <p className="text-xs text-gray-600 mb-3">
                                            Landing:{' '}
                                            {visitor.landingPages.join(', ')}
                                          </p>
                                        )}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                          {FUNNEL_STEPS.map((step) => {
                                            const done = visitor.completedSteps.includes(step);
                                            return (
                                              <Badge
                                                key={step}
                                                variant={done ? 'default' : 'outline'}
                                                className={`text-xs font-normal ${
                                                  done
                                                    ? 'bg-therapy-purple/90'
                                                    : 'text-gray-400 border-gray-200'
                                                }`}
                                              >
                                                {STEP_LABELS[step]}
                                                {step === 'message_sent' && done
                                                  ? ` (${visitor.messageCount})`
                                                  : ''}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {visitor.conversationId && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              asChild
                                              className="h-8 text-xs"
                                            >
                                              <Link
                                                to={`/conversation/${visitor.conversationId}`}
                                              >
                                                View conversation
                                                <ExternalLink className="ml-1 h-3 w-3" />
                                              </Link>
                                            </Button>
                                          )}
                                        </div>
                                        <details className="mt-3">
                                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                            Event log ({visitor.events.length})
                                          </summary>
                                          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                            {visitor.events.map((ev, i) => (
                                              <li
                                                key={`${ev.createdAt}-${i}`}
                                                className="text-xs text-gray-600 font-mono flex gap-2"
                                              >
                                                <span className="text-gray-400 shrink-0">
                                                  {formatDate(ev.createdAt)}
                                                </span>
                                                <span>{STEP_LABELS[ev.eventName]}</span>
                                                {ev.pageSlug && (
                                                  <span className="text-gray-400">
                                                    · {ev.pageSlug}
                                                  </span>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        </details>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

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
    </>
  );
};

export default ShareLinks;
