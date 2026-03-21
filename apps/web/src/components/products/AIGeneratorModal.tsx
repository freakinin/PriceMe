import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Paperclip, Send, X, Globe, Zap, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChatThinkingBubble } from '@/components/coach/ChatMessage';
import { formatCurrency } from '@/utils/currency';
import { openSettingsAt } from '@/lib/openSettings';
import { useCategories } from '@/hooks/useCategories';
import api from '@/lib/api';

// ---- Types ----

type MessageRole = 'user' | 'model';

interface ChatOptions {
  type: 'single' | 'multi';
  choices: string[];
}

interface ProductDraft {
  name: string;
  sku?: string;
  description?: string;
  batch_size: number;
  category_id?: number;
  category_name?: string;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    units_made?: number;
    per_batch?: boolean;
  }>;
  labor_costs: Array<{
    activity: string;
    time_minutes: number;
    hourly_rate: number;
    per_batch?: boolean;
  }>;
  other_costs: Array<{
    item: string;
    quantity: number;
    cost: number;
    per_batch?: boolean;
  }>;
  target_price?: number;
  pricing_method?: 'markup' | 'price' | 'profit' | 'margin';
  pricing_value?: number;
}

interface LocalMessage {
  id: number;
  role: MessageRole;
  content: string;
  options?: ChatOptions;
  optionsUsed?: boolean;
  draft?: ProductDraft;
}

interface HistoryEntry {
  role: MessageRole;
  content: string;
}

// ---- QuickReplyChips ----

function QuickReplyChips({
  options,
  onSingleSelect,
  multiSelectPending,
  onToggleMulti,
  onConfirmMulti,
}: {
  options: ChatOptions;
  onSingleSelect: (choice: string) => void;
  multiSelectPending: string[];
  onToggleMulti: (choice: string) => void;
  onConfirmMulti: () => void;
}) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const otherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showOtherInput) {
      setTimeout(() => otherInputRef.current?.focus(), 50);
    }
  }, [showOtherInput]);

  const isOtherChoice = (choice: string) =>
    choice === 'Other' || choice.toLowerCase().startsWith('other');

  const handleChipClick = (choice: string) => {
    if (isOtherChoice(choice)) {
      setShowOtherInput(true);
      setOtherValue('');
    } else if (options.type === 'single') {
      onSingleSelect(choice);
    } else {
      onToggleMulti(choice);
    }
  };

  const handleOtherSubmit = () => {
    const val = otherValue.trim();
    if (!val) return;
    if (options.type === 'single') {
      onSingleSelect(val);
    } else {
      onToggleMulti(val);
      setShowOtherInput(false);
      setOtherValue('');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2 pl-1 items-center">
      {options.choices.map(choice => {
        const isOther = isOtherChoice(choice);
        const isSelected = multiSelectPending.includes(choice);
        return (
          <button
            key={choice}
            type="button"
            onClick={() => handleChipClick(choice)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-warm-200 hover:border-primary hover:text-primary',
              isOther && showOtherInput && 'border-primary text-primary'
            )}
          >
            {isOther ? 'Other...' : choice}
          </button>
        );
      })}

      {/* Confirm button for multi-select — visually distinct (green) */}
      {options.type === 'multi' && multiSelectPending.length > 0 && !showOtherInput && (
        <>
          <div className="w-px h-5 bg-warm-200 self-center mx-1 flex-shrink-0" />
          <button
            type="button"
            onClick={onConfirmMulti}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 flex-shrink-0"
          >
            <Check className="h-3.5 w-3.5" />
            Confirm ({multiSelectPending.length})
          </button>
        </>
      )}

      {/* Inline "Other" text input */}
      {showOtherInput && (
        <div className="w-full flex gap-2 mt-1">
          <input
            ref={otherInputRef}
            type="text"
            value={otherValue}
            onChange={e => setOtherValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleOtherSubmit();
              }
              if (e.key === 'Escape') {
                setShowOtherInput(false);
              }
            }}
            placeholder="Type your answer..."
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={handleOtherSubmit}
            disabled={!otherValue.trim()}
            className="flex items-center gap-1 px-3 h-8 rounded-md text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Competitor URL Modal ----

function CompetitorUrlModal({
  open,
  onOpenChange,
  urls,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const url = inputValue.trim();
    if (url.startsWith('http') && !urls.includes(url) && urls.length < 5) {
      onAdd(url);
      setInputValue('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Competitor URLs
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add competitor product URLs. The AI will analyze their pricing and materials and use it as context when generating your product.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://etsy.com/listing/..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              disabled={urls.length >= 5}
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={urls.length >= 5 || !inputValue.trim().startsWith('http')}
            >
              Add
            </Button>
          </div>

          {urls.length > 0 ? (
            <div className="space-y-1.5">
              {urls.map(url => {
                let hostname = url;
                try { hostname = new URL(url).hostname; } catch { /* noop */ }
                return (
                  <div key={url} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{hostname}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(url)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                {urls.length}/5 URLs · Analyzed on your next message
              </p>
            </div>
          ) : (
            <div className="text-center py-3 text-sm text-muted-foreground">
              No competitor URLs added yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Cost Tooltip ----

function CostSectionTooltip({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (items.length === 0) return <span className="font-medium">—</span>;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="flex items-center gap-1 font-medium hover:text-primary transition-colors">
            {label}
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs space-y-0.5 p-2">
          {items.map((item, i) => (
            <div key={i} className="text-left">{item}</div>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---- Draft Preview Card ----

function ProductDraftCard({
  draft,
  currency,
  onUse,
}: {
  draft: ProductDraft;
  currency: string;
  onUse: () => void;
}) {
  const matTotal = draft.materials.reduce(
    (sum, m) => sum + (m.quantity * m.price_per_unit) / (m.units_made ?? 1),
    0
  );
  const laborTotal = draft.labor_costs.reduce(
    (sum, l) => sum + (l.time_minutes / 60) * l.hourly_rate,
    0
  );
  const otherTotal = draft.other_costs.reduce((sum, o) => sum + o.quantity * o.cost, 0);
  const totalCost = matTotal + laborTotal + otherTotal;

  const materialLines = draft.materials.map(
    m => `${m.name} — ${m.quantity} ${m.unit} @ ${formatCurrency(m.price_per_unit, currency)}/${m.unit}`
  );
  const laborLines = draft.labor_costs.map(
    l => `${l.activity} — ${l.time_minutes} min @ ${formatCurrency(l.hourly_rate, currency)}/hr`
  );
  const otherLines = draft.other_costs.map(
    o => `${o.item} — ${o.quantity} × ${formatCurrency(o.cost, currency)}`
  );

  return (
    <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{draft.name}</p>
          {draft.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {draft.description}
            </p>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">
          Draft
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Materials</div>
          <CostSectionTooltip label={formatCurrency(matTotal, currency)} items={materialLines} />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {draft.materials.length} item{draft.materials.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Labor</div>
          <CostSectionTooltip label={formatCurrency(laborTotal, currency)} items={laborLines} />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {draft.labor_costs.length} task{draft.labor_costs.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Other</div>
          <CostSectionTooltip label={formatCurrency(otherTotal, currency)} items={otherLines} />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {draft.other_costs.length} item{draft.other_costs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-primary/20 pt-2.5">
        <div className="text-sm">
          <span className="text-muted-foreground text-xs">Total cost: </span>
          <span className="font-bold text-primary">{formatCurrency(totalCost, currency)}</span>
          {draft.target_price != null && (
            <span className="text-xs text-muted-foreground ml-2">
              · Suggested price: {formatCurrency(draft.target_price, currency)}
            </span>
          )}
        </div>
        <Button size="sm" onClick={onUse} className="h-7 text-xs px-3">
          Use This Product
        </Button>
      </div>
    </div>
  );
}

// ---- Main Modal ----

interface AIGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  isEnabled: boolean;
  laborHourlyCost?: number | null;
  unitSystem?: string | null;
}

export function AIGeneratorModal({
  open,
  onOpenChange,
  currency,
  isEnabled,
  laborHourlyCost,
  unitSystem,
}: AIGeneratorModalProps) {
  const navigate = useNavigate();
  const { categories, createCategory } = useCategories();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [apiHistory, setApiHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);

  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  const [multiSelectPending, setMultiSelectPending] = useState<string[]>([]);
  const [completedDraft, setCompletedDraft] = useState<ProductDraft | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Show static greeting when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          role: 'model',
          content:
            "Hi! I'll help you build a complete product with materials, labor, and cost estimates. What do you make?",
        },
      ]);
    }
  }, [open]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const resetState = () => {
    setMessages([]);
    setApiHistory([]);
    setInput('');
    setIsLoading(false);
    setError(null);
    setSelectedImage(null);
    setImageBase64(null);
    setImageMimeType(null);
    setCompetitorUrls([]);
    setIsUrlModalOpen(false);
    setMultiSelectPending([]);
    setCompletedDraft(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB');
      return;
    }
    setSelectedImage(file);
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    const userMsgId = Date.now();
    const userMsg: LocalMessage = { id: userMsgId, role: 'user', content: text };

    // Mark options on last AI message as used
    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === 'model') {
          updated[i] = { ...updated[i], optionsUsed: true };
          break;
        }
      }
      return [...updated, userMsg];
    });

    setInput('');
    setMultiSelectPending([]);
    setIsLoading(true);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const body: Record<string, any> = {
        history: apiHistory,
        userMessage: text,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        ...(laborHourlyCost != null && { laborHourlyCost }),
        ...(unitSystem != null && { unitSystem }),
      };

      if (imageBase64 && imageMimeType) {
        body.contextImage = { base64: imageBase64, mimeType: imageMimeType };
      }

      if (competitorUrls.length > 0) {
        body.competitorUrls = competitorUrls;
      }

      const res = await api.post('/ai-generate/chat', body);
      const { message, options, productDraft, isComplete } = res.data.data;

      const aiMsg: LocalMessage = {
        id: Date.now() + 1,
        role: 'model',
        content: message,
        options,
        optionsUsed: false,
        draft: productDraft,
      };

      setMessages(prev => [...prev, aiMsg]);
      setApiHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'model', content: message },
      ]);

      if (isComplete && productDraft) {
        setCompletedDraft(productDraft);
      }
    } catch (err: any) {
      const errMsg =
        err.response?.status === 403
          ? 'AI Product Generator requires Starter plan or higher.'
          : err.response?.data?.message ?? 'Something went wrong. Try again.';
      setError(errMsg);
      setMessages(prev => prev.filter(m => m.id !== userMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseProduct = async () => {
    if (!completedDraft) return;
    let draft = { ...completedDraft };

    // Create new category if AI suggested one that doesn't exist yet
    if (draft.category_name && !draft.category_id) {
      try {
        const result = await createCategory({ name: draft.category_name });
        if (result?.data?.id) {
          draft = { ...draft, category_id: result.data.id };
        }
      } catch {
        // Category creation failed silently — product will just have no category pre-set
      }
    }

    handleClose();
    navigate('/products/add', {
      state: {
        prefill: draft,
        competitorUrls: competitorUrls.length > 0 ? competitorUrls : undefined,
      },
    });
  };

  const hasContext = selectedImage !== null || competitorUrls.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl w-full h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Generate Product with AI
            </DialogTitle>
          </DialogHeader>

          {!isEnabled ? (
            /* Plan gate */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <Zap className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">Starter Plan Required</p>
                <p className="text-sm text-muted-foreground">
                  AI Product Generator is available on Starter plan and above. Upgrade to let AI build
                  your full product cost breakdown in minutes.
                </p>
              </div>
              <Button
                onClick={() => {
                  handleClose();
                  openSettingsAt('subscription');
                }}
              >
                View Plans
              </Button>
            </div>
          ) : (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
                {messages.map((msg, idx) => {
                  const isLastModel =
                    msg.role === 'model' &&
                    idx === messages.findLastIndex(m => m.role === 'model');

                  return (
                    <div key={msg.id}>
                      <div
                        className={cn(
                          'flex',
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted text-foreground rounded-tl-sm'
                          )}
                        >
                          {msg.content.split('\n').map((line, i, arr) => (
                            <span key={i}>
                              {line}
                              {i < arr.length - 1 && <br />}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Quick-reply chips — only on last AI message, before user responds */}
                      {msg.role === 'model' &&
                        isLastModel &&
                        msg.options &&
                        !msg.optionsUsed &&
                        !isLoading && (
                          <QuickReplyChips
                            options={msg.options}
                            onSingleSelect={choice => sendMessage(choice)}
                            multiSelectPending={multiSelectPending}
                            onToggleMulti={choice =>
                              setMultiSelectPending(prev =>
                                prev.includes(choice)
                                  ? prev.filter(c => c !== choice)
                                  : [...prev, choice]
                              )
                            }
                            onConfirmMulti={() => {
                              sendMessage(multiSelectPending.join(', '));
                            }}
                          />
                        )}

                      {/* Draft preview card */}
                      {msg.draft && (
                        <ProductDraftCard
                          draft={msg.draft}
                          currency={currency}
                          onUse={handleUseProduct}
                        />
                      )}
                    </div>
                  );
                })}

                {isLoading && <ChatThinkingBubble />}

                {error && (
                  <p className="text-xs text-destructive text-center py-1">{error}</p>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="border-t px-5 py-3 flex-shrink-0 space-y-2">
                {/* Context attachments bar — shows when image or URLs are attached */}
                {hasContext && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedImage && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
                        <Paperclip className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{selectedImage.name}</span>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="ml-0.5 hover:text-foreground flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {competitorUrls.map(url => {
                      let hostname = url;
                      try { hostname = new URL(url).hostname; } catch { /* noop */ }
                      return (
                        <div
                          key={url}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1"
                        >
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{hostname}</span>
                          <button
                            type="button"
                            onClick={() => setCompetitorUrls(prev => prev.filter(u => u !== url))}
                            className="ml-0.5 hover:text-foreground flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text input row */}
                <div className="flex gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  {/* Image attach button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      'h-9 w-9 flex-shrink-0 self-end',
                      selectedImage && 'border-primary text-primary'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach product photo"
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  {/* Competitor URL button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      'h-9 w-9 flex-shrink-0 self-end relative',
                      competitorUrls.length > 0 && 'border-primary text-primary'
                    )}
                    onClick={() => setIsUrlModalOpen(true)}
                    title="Add competitor URLs"
                    disabled={isLoading}
                  >
                    <Globe className="h-4 w-4" />
                    {competitorUrls.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                        {competitorUrls.length}
                      </span>
                    )}
                  </Button>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      autoResizeTextarea();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Describe your product or answer the question above..."
                    rows={1}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm',
                      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                      'min-h-[36px] overflow-y-auto'
                    )}
                    style={{ height: '36px' }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 self-end"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Competitor URL manager — rendered as sibling dialog to avoid nesting issues */}
      <CompetitorUrlModal
        open={isUrlModalOpen}
        onOpenChange={setIsUrlModalOpen}
        urls={competitorUrls}
        onAdd={url => setCompetitorUrls(prev => [...prev, url])}
        onRemove={url => setCompetitorUrls(prev => prev.filter(u => u !== url))}
      />
    </>
  );
}
