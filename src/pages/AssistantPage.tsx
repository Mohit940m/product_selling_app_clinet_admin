import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { FiMessageSquare, FiPlus, FiSend, FiTrash2, FiZap } from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  agentErrorMessage,
  deleteConversation,
  getConversation,
  listConversations,
  sendChat,
} from '../api/agentApi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Sheet from '../components/ui/Sheet';
import ProductFormBlock from '../components/assistant/ProductFormBlock';
import {
  NoticeBlock,
  PendingActionCard,
  SellerOrderBlock,
  SellerOrdersBlock,
  SellerProductBlock,
  SellerProductsBlock,
} from '../components/assistant/SellerBlocks';
import type { Block, ChatAction, ChatMessage, ChatResponse, ConversationSummary } from '../components/assistant/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SUGGESTIONS = ['Add a product', 'Which products are low on stock?', 'Show my recent orders', 'Restock a product'];

let localId = 0;
const nextId = () => `m${++localId}`;

const withIds = (messages: Omit<ChatMessage, 'id'>[]): ChatMessage[] => messages.map((m) => ({ ...m, id: nextId() }));

type BlockViewProps = {
  block: Block;
  busy: boolean;
  onSend: (text: string) => void;
  onSubmitForm: (values: Record<string, unknown>) => Promise<boolean>;
  interactive: boolean;
};

const BlockView = ({ block, busy, onSend, onSubmitForm, interactive }: BlockViewProps) => {
  switch (block.type) {
    case 'seller_products':
      return <SellerProductsBlock data={block.data} onSend={onSend} disabled={busy} />;
    case 'seller_product':
      return <SellerProductBlock data={block.data} onSend={onSend} disabled={busy} />;
    case 'seller_orders':
      return <SellerOrdersBlock data={block.data} />;
    case 'seller_order':
      return <SellerOrderBlock data={block.data} />;
    case 'notice':
      return <NoticeBlock data={block.data} />;
    case 'product_form':
      return interactive ? (
        <ProductFormBlock prefill={block.data.prefill ?? {}} onSubmit={onSubmitForm} disabled={busy} />
      ) : (
        <p className="rounded-tile border border-line bg-soft2 p-3.5 text-[12.5px] font-semibold text-muted">Add-product form (closed)</p>
      );
    default:
      return null;
  }
};

/**
 * Seller assistant backed by product_selling_app_agent's /api/v1/seller-chat,
 * which runs store actions through the server's MCP tools as this seller.
 */
const AssistantPage = () => {
  useDocumentTitle('Assistant');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const refreshConversations = useCallback(() => {
    listConversations()
      .then(setConversations)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const applyResponse = (response: ChatResponse) => {
    setConversationId(response.conversationId);
    setMessages((current) => [
      ...current,
      {
        id: nextId(),
        role: 'assistant',
        text: response.reply,
        blocks: response.blocks,
        pendingAction: response.pendingAction ? { ...response.pendingAction, status: 'pending' } : null,
      },
    ]);
    refreshConversations();
  };

  // Any open confirmation is resolved once the user does something else.
  const settlePending = (status: 'confirmed' | 'cancelled') =>
    setMessages((current) =>
      current.map((m) => (m.pendingAction?.status === 'pending' ? { ...m, pendingAction: { ...m.pendingAction, status } } : m)),
    );

  const run = async (userEntry: ChatMessage, body: { message?: string; action?: ChatAction }, settle: 'confirmed' | 'cancelled') => {
    if (busy) return false;
    setBusy(true);
    settlePending(settle);
    setMessages((current) => [...current, userEntry]);
    try {
      applyResponse(await sendChat({ conversationId, ...body }));
      return true;
    } catch (err) {
      const message = agentErrorMessage(err);
      setMessages((current) => [
        ...current,
        { id: nextId(), role: 'assistant', text: '', blocks: [{ type: 'notice', data: { tone: 'error', message } }] },
      ]);
      return false;
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    void run({ id: nextId(), role: 'user', kind: 'text', text: trimmed }, { message: trimmed }, 'cancelled');
  };

  const decide = (actionId: string, confirmed: boolean) => {
    const pending = messages.find((m) => m.pendingAction?.id === actionId)?.pendingAction;
    void run(
      { id: nextId(), role: 'user', kind: 'action', text: `${confirmed ? 'Confirmed' : 'Cancelled'}: ${pending?.summary ?? ''}` },
      { action: { type: confirmed ? 'confirm' : 'cancel', actionId } },
      confirmed ? 'confirmed' : 'cancelled',
    );
  };

  const submitForm = async (values: Record<string, unknown>) => {
    const ok = await run(
      { id: nextId(), role: 'user', kind: 'action', text: `Submitted product form: ${String(values.name)}` },
      { action: { type: 'submit_form', form: 'create_product', values } },
      'cancelled',
    );
    if (!ok) toast.error('The product wasn’t created. Check the message below and try again.');
    return ok;
  };

  const openConversation = async (id: string) => {
    setHistoryOpen(false);
    if (id === conversationId || busy) return;
    setLoadingConversation(true);
    try {
      const detail = await getConversation(id);
      setConversationId(detail._id);
      setMessages(withIds(detail.messages));
    } catch (err) {
      toast.error(agentErrorMessage(err));
    } finally {
      setLoadingConversation(false);
    }
  };

  const startNew = () => {
    setHistoryOpen(false);
    if (busy) return;
    setConversationId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const removeConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations((current) => current.filter((c) => c._id !== id));
      if (id === conversationId) startNew();
    } catch (err) {
      toast.error(agentErrorMessage(err));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  const history = (
    <div className="flex flex-col gap-2">
      <Button variant="primary" size="sm" icon={<FiPlus size={14} />} onClick={startNew} disabled={busy}>
        New chat
      </Button>
      {conversations.length === 0 && <p className="px-1 text-[12px] font-medium text-muted">No chats yet.</p>}
      <ul className="flex flex-col gap-1">
        {conversations.map((c) => (
          <li key={c._id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => openConversation(c._id)}
              className={`min-w-0 flex-1 truncate rounded-[11px] px-3 py-2.5 text-left text-[12.5px] t-fast focus-visible:outline-2 focus-visible:outline-accent ${
                c._id === conversationId ? 'bg-ink font-extrabold text-card' : 'font-semibold text-muted hover:bg-card hover:text-ink'
              }`}
            >
              {c.title}
            </button>
            <button
              type="button"
              onClick={() => removeConversation(c._id)}
              aria-label={`Delete chat ${c.title}`}
              className="rounded-[9px] p-2 text-muted opacity-60 t-fast hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
            >
              <FiTrash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Container className="py-6 lg:py-8">
      <PageHeader
        title="Assistant"
        subtitle="Ask about stock and orders, restock, or add a product with photos — changes wait for your confirmation."
        actions={
          <Button variant="outline" size="sm" icon={<FiMessageSquare size={14} />} className="lg:hidden" onClick={() => setHistoryOpen(true)}>
            Chats
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{history}</aside>

        <section className="flex h-[calc(100dvh-15rem)] min-h-[440px] flex-col rounded-panel border border-line bg-card lg:h-[calc(100dvh-12rem)]">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {loadingConversation && <p className="text-[12.5px] font-medium text-muted">Loading chat…</p>}

            {!loadingConversation && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-soft text-[var(--k-on-soft)]">
                  <FiZap size={22} />
                </span>
                <h2 className="text-[17px] font-extrabold text-ink">How can I help with your store?</h2>
                <p className="mt-1 max-w-sm text-[12.5px] font-medium text-muted">
                  I can check stock, restock variants, show orders and item statuses, and add new products.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Chip key={s} onClick={() => send(s)} disabled={busy}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, index) =>
              m.role === 'user' ? (
                m.kind === 'action' ? (
                  <p key={m.id} className="mx-auto w-fit max-w-full rounded-full bg-soft2 px-3.5 py-1.5 text-center text-[11.5px] font-semibold text-muted">
                    {m.text}
                  </p>
                ) : (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[13px] font-medium text-card">
                      {m.text}
                    </p>
                  </div>
                )
              ) : (
                <div key={m.id} className="max-w-full space-y-2.5 sm:max-w-[92%]">
                  {m.text && (
                    <p className="w-fit whitespace-pre-wrap rounded-[18px] rounded-bl-[6px] bg-soft2 px-4 py-2.5 text-[13px] font-medium text-ink">
                      {m.text}
                    </p>
                  )}
                  {(m.blocks ?? []).map((block, i) => (
                    <BlockView
                      key={`${m.id}-${i}`}
                      block={block}
                      busy={busy}
                      onSend={send}
                      onSubmitForm={submitForm}
                      interactive={index === lastAssistantIndex}
                    />
                  ))}
                  {m.pendingAction && (
                    <PendingActionCard pending={m.pendingAction} isLatest={index === lastAssistantIndex} busy={busy} onDecide={decide} />
                  )}
                </div>
              ),
            )}

            {busy && (
              <div className="flex w-fit items-center gap-1.5 rounded-[18px] bg-soft2 px-4 py-3" role="status" aria-label="Assistant is thinking">
                <span className="h-1.5 w-1.5 animate-dot rounded-full bg-muted" />
                <span className="h-1.5 w-1.5 animate-dot rounded-full bg-muted" style={{ animationDelay: '.2s' }} />
                <span className="h-1.5 w-1.5 animate-dot rounded-full bg-muted" style={{ animationDelay: '.4s' }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2.5 border-t border-line p-3 sm:p-4">
            <label htmlFor="assistant-input" className="sr-only">
              Message the assistant
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. Add 20 units to the black M hoodie"
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-btn border border-line bg-transparent px-4 py-3 text-base font-medium text-ink placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[13px]"
            />
            <Button type="submit" variant="primary" icon={<FiSend size={15} />} disabled={busy || !input.trim()} aria-label="Send">
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </section>
      </div>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Chats">
        {history}
      </Sheet>
    </Container>
  );
};

export default AssistantPage;
