import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  getWaitlistLinkedConversationId,
  internalCmsService,
  type WaitlistSubmissionRow,
} from '@/services/internalCmsService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInternalPageHeader } from '@/components/internal/InternalLayoutContext';

const PAGE_SIZE = 25;

const Waitlist: React.FC = () => {
  const { isInternal } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<WaitlistSubmissionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await internalCmsService.getWaitlistSubmissions({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search: searchQuery || undefined,
      });
      setRows(result.data);
      setTotalCount(result.count);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load waitlist signups.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, toast]);

  useEffect(() => {
    if (isInternal) load();
  }, [isInternal, load]);

  useInternalPageHeader(
    {
      headerActions: (
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      ),
    },
    [loading, load],
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: email,
        variant: 'destructive',
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearchQuery(searchInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (!isInternal) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-therapy-purple" />
              Total signups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-therapy-purple">{totalCount}</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardDescription>About</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">
              Everyone who submitted the email capture form after completing a chat.
              Variant A/B reflects the signup copy test.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setPage(0);
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
        <CardHeader>
          <CardTitle>Waitlist signups</CardTitle>
          <CardDescription>
            Name, email, landing page, A/B variant, and linked conversation when available.
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
              {searchQuery
                ? 'No signups match your search.'
                : 'No waitlist signups yet.'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Signed up</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-gray-800">
                          {row.name}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${row.email}`}
                            className="text-therapy-purple hover:underline"
                          >
                            {row.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {row.ab_variant}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {row.page_slug ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyEmail(row.email)}
                              title="Copy email"
                            >
                              {copiedEmail === row.email ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            {getWaitlistLinkedConversationId(row) && (
                              <Button size="sm" variant="ghost" asChild title="View conversation">
                                <Link
                                  to={`/internal/conversation/${getWaitlistLinkedConversationId(row)}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Page {page + 1} of {totalPages} · {totalCount} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Waitlist;
