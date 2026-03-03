import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { createTicketSchema, type CreateTicketInput } from '@priceme/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { track } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

interface FaqGroup {
  label: string;
  items: FaqItem[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    label: 'Getting Started',
    items: [
      {
        id: 1,
        question: 'How do I add my first product?',
        answer:
          'Navigate to Products and click "Add Product" in the sidebar. Fill in your product name, then add materials, labor costs, and other expenses. Cravio automatically calculates your recommended price based on your cost breakdown and markup settings.',
      },
      {
        id: 2,
        question: 'How is the recommended price calculated?',
        answer:
          'Cravio uses the formula: Total Cost ÷ (1 − Profit Margin %) + any additional markup. Your default margin and hourly labor rate are set in Settings → Financial. You can override the price anytime by switching to "Manual Price" mode on a product.',
      },
      {
        id: 3,
        question: 'What does the Business Health Score mean?',
        answer:
          'The Health Score (shown on the Coach page) rates your pricing portfolio from 0–100. It factors in how many products have healthy profit margins, whether you have pricing consistency, and how actively you track costs. A score above 70 is considered healthy.',
      },
    ],
  },
  {
    label: 'Features',
    items: [
      {
        id: 4,
        question: 'How do I track competitors?',
        answer:
          'Open a product and click "Market Analysis". Enter a competitor\'s URL or search term and Cravio\'s AI will analyze their pricing and give you recommendations. You can save competitor insights and track price changes over time.',
      },
      {
        id: 5,
        question: 'Can I use product templates?',
        answer:
          'Yes — on the Create Product page, click "Load Template". Templates save your standard material lists and cost structures so you can create similar products quickly. You can save any product as a template from the product detail page.',
      },
      {
        id: 6,
        question: 'How do I record a sale?',
        answer:
          'Go to On Sale, find your product, and click "Record Sale". Enter the quantity, sale price, and optional discount or platform. Sales are tracked in your revenue history and feed into Coach insights.',
      },
      {
        id: 7,
        question: 'What are the plan limits?',
        answer:
          'The Free plan supports up to 3 products and 2 competitors. Starter ($12/mo) gives you 25 products. Pro ($19/mo) gives you 75 products. Business ($49/mo) is unlimited. You can view your current usage in Settings → Usage and upgrade in Settings → Subscription.',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 8,
        question: 'How do I change my currency?',
        answer:
          'Go to Settings → Financial. Select your currency from the dropdown — all prices and cost displays across the app will update immediately.',
      },
      {
        id: 9,
        question: 'What is the Coach feature?',
        answer:
          'The Coach is your AI-powered pricing advisor. It generates personalized insights about your product portfolio, alerts you to underpriced items, and lets you have a conversation with it to get specific pricing advice. Access it via the "Coach" link in the sidebar.',
      },
      {
        id: 10,
        question: 'How do I add materials to a product?',
        answer:
          'On the Create or Edit Product page, scroll to the Materials section. You can add materials from your saved material library or create new ones inline. Each material tracks quantity used and unit cost, contributing to the total cost automatically.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------

interface AccordionItemProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-warm-200 rounded-lg mb-2 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-warm-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-inset"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-warm-900 pr-4">{item.question}</span>
        <ChevronDown
          className="h-4 w-4 text-warm-500 flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        />
      </button>

      {/* Answer panel — CSS max-height transition for smooth animation */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: isOpen ? '600px' : '0px' }}
      >
        <div className="px-4 pb-4 pt-1">
          <p className="text-warm-700 text-sm leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Help page
// ---------------------------------------------------------------------------

export default function Help() {
  const { toast } = useToast();

  // --- FAQ state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Ticket form ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
  });

  // Track page open once on mount
  useEffect(() => {
    track({ event: 'help_page_opened' });
  }, []);

  // Debounced FAQ search analytics
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchQuery.length >= 3) {
      searchDebounceRef.current = setTimeout(() => {
        track({ event: 'faq_searched', query: searchQuery });
      }, 600);
    }
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Toggle an FAQ item open/closed
  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter groups + items by search query
  const filteredGroups = FAQ_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  })).filter((group) => group.items.length > 0);

  const totalFilteredItems = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Submit support ticket
  const onSubmit = async (data: CreateTicketInput) => {
    setIsSubmitting(true);
    try {
      await api.post('/support', data);
      toast({
        title: 'Ticket submitted',
        description: "We'll get back to you within 24 hours.",
        variant: 'success' as any,
      });
      track({ event: 'ticket_submitted', category: data.category });
      reset();
    } catch (err: any) {
      toast({
        title: 'Failed to submit',
        description: err.response?.data?.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-warm-900">Help Center</h1>
        <p className="mt-1 text-warm-500 text-sm">
          Browse common questions or send us a message — we typically reply within 24 hours.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* ----------------------------------------------------------------- */}
        {/* Left column — FAQ                                                  */}
        {/* ----------------------------------------------------------------- */}
        <div className="xl:col-span-3 space-y-6">
          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-500 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-warm-200 bg-white placeholder:text-warm-500 focus-visible:ring-brand-700"
            />
          </div>

          {/* Result count badge when filtering */}
          {searchQuery.trim() !== '' && (
            <p className="text-xs text-warm-500">
              {totalFilteredItems === 0 ? (
                'No questions match your search.'
              ) : (
                <>
                  Showing{' '}
                  <span className="inline-flex items-center justify-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {totalFilteredItems}
                  </span>{' '}
                  {totalFilteredItems === 1 ? 'result' : 'results'}
                </>
              )}
            </p>
          )}

          {/* FAQ accordion groups */}
          {filteredGroups.length === 0 ? (
            <p className="text-warm-500 text-sm">No questions found. Try a different search term.</p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.label}>
                {/* Group heading — small ALL-CAPS label */}
                <p className="text-xs font-semibold uppercase tracking-widest text-warm-500 mb-3">
                  {group.label}
                </p>

                {group.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right column — Contact support ticket                              */}
        {/* ----------------------------------------------------------------- */}
        <div className="xl:col-span-2">
          <Card className="border-warm-200 bg-warm-100 shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-xl text-warm-900">
                Contact Support
              </CardTitle>
              <CardDescription className="text-warm-500 text-sm">
                Can't find what you need? Send us a ticket and we'll help you out.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-warm-900 text-sm font-medium">
                    Category
                  </Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger
                          id="category"
                          className="border-warm-200 bg-white focus:ring-brand-700"
                        >
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-xs text-red-500">{errors.category.message}</p>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-warm-900 text-sm font-medium">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of your issue"
                    className="border-warm-200 bg-white placeholder:text-warm-500 focus-visible:ring-brand-700"
                    {...register('subject')}
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-500">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-warm-900 text-sm font-medium">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    rows={6}
                    placeholder="Describe your issue or question in detail..."
                    className="border-warm-200 bg-white placeholder:text-warm-500 focus-visible:ring-brand-700 resize-none"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500">{errors.message.message}</p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-700 hover:bg-brand-500 text-white transition-colors duration-150"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
