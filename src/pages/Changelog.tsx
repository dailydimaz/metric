import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GitCommit, ExternalLink, Calendar, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

interface GroupedCommits {
  [date: string]: Commit[];
}

const GITHUB_REPO = "dailydimaz/mmmetric";
const COMMITS_PER_PAGE = 100;

export default function Changelog() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCommits = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=${COMMITS_PER_PAGE}&page=${pageNum}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }
      
      const data: Commit[] = await response.json();
      
      if (data.length < COMMITS_PER_PAGE) {
        setHasMore(false);
      }
      
      if (append) {
        setCommits(prev => [...prev, ...data]);
      } else {
        setCommits(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCommits(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCommits(nextPage, true);
  };

  // Group commits by date
  const groupedCommits = commits.reduce<GroupedCommits>((acc, commit) => {
    const date = format(new Date(commit.commit.author.date), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(commit);
    return acc;
  }, {});

  // Parse commit message for type badge
  const getCommitType = (message: string): { type: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.startsWith("feat") || lowerMessage.includes("add")) {
      return { type: "Feature", variant: "default" };
    }
    if (lowerMessage.startsWith("fix") || lowerMessage.includes("bug")) {
      return { type: "Fix", variant: "destructive" };
    }
    if (lowerMessage.startsWith("refactor") || lowerMessage.includes("refactor")) {
      return { type: "Refactor", variant: "secondary" };
    }
    if (lowerMessage.startsWith("docs") || lowerMessage.includes("readme")) {
      return { type: "Docs", variant: "outline" };
    }
    if (lowerMessage.startsWith("style") || lowerMessage.includes("ui")) {
      return { type: "Style", variant: "secondary" };
    }
    if (lowerMessage.startsWith("perf") || lowerMessage.includes("performance")) {
      return { type: "Perf", variant: "default" };
    }
    return { type: "Update", variant: "outline" };
  };

  // Get first line of commit message
  const getCommitTitle = (message: string) => {
    return message.split("\n")[0].slice(0, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-display">Changelog</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time updates from our development
                </p>
              </div>
            </div>
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <GitCommit className="h-4 w-4" />
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-20 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => fetchCommits(1)} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedCommits).map(([date, dateCommits]) => (
              <div key={date} className="relative">
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4 sticky top-20 bg-background/95 backdrop-blur-sm py-2 z-10">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    {format(new Date(date), "MMMM d, yyyy")}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({dateCommits.length} commit{dateCommits.length > 1 ? "s" : ""})
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative pl-6 border-l-2 border-border space-y-4">
                  {dateCommits.map((commit) => {
                    const { type, variant } = getCommitType(commit.commit.message);
                    return (
                      <div key={commit.sha} className="relative group">
                        {/* Timeline dot */}
                        <div className="absolute -left-[25px] top-3 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        
                        <Card className="transition-all hover:shadow-md hover:border-primary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant={variant} className="text-xs">
                                    {type}
                                  </Badge>
                                  <code className="text-xs text-muted-foreground font-mono">
                                    {commit.sha.slice(0, 7)}
                                  </code>
                                </div>
                                <p className="font-medium text-foreground leading-snug">
                                  {getCommitTitle(commit.commit.message)}
                                </p>
                                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    {commit.author?.avatar_url ? (
                                      <img
                                        src={commit.author.avatar_url}
                                        alt={commit.author.login}
                                        className="h-5 w-5 rounded-full"
                                      />
                                    ) : (
                                      <User className="h-4 w-4" />
                                    )}
                                    <span>{commit.author?.login || commit.commit.author.name}</span>
                                  </div>
                                  <span>•</span>
                                  <span>
                                    {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={commit.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="text-center pt-6">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Commits"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
