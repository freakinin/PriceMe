import { useState, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface RoadmapFeature {
  id: number;
  name: string;
  description: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  userVotedUp: boolean;
  userVotedDown: boolean;
}

export default function Roadmap() {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [votingFeatureId, setVotingFeatureId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchFeatures = async (search?: string) => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const response = await api.get('/roadmap', { params });
      if (response.data.status === 'success') {
        setFeatures(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching roadmap features:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roadmap features',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFeatures(searchQuery || undefined);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleVote = async (featureId: number, voteType: 'up' | 'down') => {
    try {
      setVotingFeatureId(featureId);
      const response = await api.post(`/roadmap/${featureId}/vote`, { voteType });
      
      if (response.data.status === 'success') {
        // Refresh features to get updated vote counts
        await fetchFeatures(searchQuery || undefined);
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record vote',
        variant: 'destructive',
      });
    } finally {
      setVotingFeatureId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Vote on features you'd like to see in PriceMe
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Features List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading features...</div>
        </div>
      ) : features.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              {searchQuery ? 'No features found matching your search' : 'No features available yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const netVotes = feature.upvotes - feature.downvotes;
            const isVoting = votingFeatureId === feature.id;

            return (
              <Card key={feature.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={feature.userVotedUp ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleVote(feature.id, 'up')}
                      disabled={isVoting}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{feature.upvotes}</span>
                    </Button>
                    <Button
                      variant={feature.userVotedDown ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleVote(feature.id, 'down')}
                      disabled={isVoting}
                      className="flex items-center gap-1"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>{feature.downvotes}</span>
                    </Button>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {netVotes > 0 && '+'}
                      {netVotes}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
