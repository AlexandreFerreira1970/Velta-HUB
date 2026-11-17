"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Text, Drawer } from "@/components/ui";
import { useChatSidebarToggle } from "@/hooks/useChatSidebarToggle";
import { useConversations } from "@/hooks/useConversations";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { useFetchConversation } from "@/hooks/useFetchConversation";
import { useHubAnalysis } from "@/hooks/useHubAnalysis";
import { useMarkInitialAnalysisSent } from "@/hooks/useMarkInitialAnalysisSent";
import { useSaveMessages } from "@/hooks/useSaveMessages";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useUser } from "@/hooks/useUser";
import { formatAnalysisPrompt } from "@/lib/hub-prompts";
import { toHubInput } from "@/lib/hub-input";
import { takeAnalysisContext } from "@/lib/hub-session";
import type {
  ChatMessage,
  ConversationState,
  ConversationSummary,
  DecisionOutput,
  VeltaUser,
} from "@/lib/types";
import {
  FIRST_TIME_WELCOME_COPY,
  HUB_FLOW,
  HUB_THANK_YOU_COPY,
  ONBOARDING_COPY,
  WELCOME_BACK_COPY,
  answerLabel,
  answersToHubValues,
  botMsg,
  getNextHubMessages,
  hubQuestionForMessage,
  restoreHubAnswers,
  userMsg,
  type HubAnswers,
} from "./_lib/hubFlow";
import { useAssistantReply } from "./_hooks/useAssistantReply";
import { useChatAutoScroll } from "./_hooks/useChatAutoScroll";
import { ChatComposer } from "./_components/ChatComposer";
import { ConversationsSidebar } from "./_components/ConversationsSidebar";
import { EmptyChatState } from "./_components/EmptyChatState";
import { HubAnalysisError } from "./_components/HubAnalysisError";
import { HubAnalysisOverlay } from "./_components/HubAnalysisOverlay";
import { HubQuestionInput } from "./_components/HubQuestionInput";
import { MessageBubble } from "./_components/MessageBubble";

type OnboardingStep =
  | "loading"
  | "ask_company"
  | "ask_business"
  | "hub"
  | "done";

/** Shape sent to the API when persisting client-generated messages. */
const toSaved = ({ role, content, id }: ChatMessage) => ({ role, content, id });

/** Most recently updated conversation whose hub flow is still in progress. */
function lastPendingConversation(
  conversations: ConversationSummary[],
): ConversationSummary | null {
  const time = (c: ConversationSummary) =>
    new Date(c.updatedAt || c.createdAt).getTime();
  return conversations
    .filter((c) => c.hubQuestionIndex !== null)
    .reduce<ConversationSummary | null>(
      (latest, c) => (!latest || time(c) >= time(latest) ? c : latest),
      null,
    );
}

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // -- Server state ----------------------------------------------------------
  const userQuery = useUser();
  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data ?? [];
  const fetchConversation = useFetchConversation();
  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutate: saveMessages } = useSaveMessages();
  const { mutateAsync: markInitialAnalysisSent } = useMarkInitialAnalysisSent();
  const hubAnalysis = useHubAnalysis();
  const { mutate: runHubAnalysis } = hubAnalysis;

  // -- Messages --------------------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("loading");

  const appendMessages = useCallback((...msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const { streamingMessage, isStreaming, streamReply } =
    useAssistantReply(appendMessages);
  const loading = savingOnboarding || isStreaming;

  // -- Conversations ---------------------------------------------------------
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  // Mirrors activeConversationId for async callbacks (avoids stale closures).
  const activeConversationIdRef = useRef<string | null>(null);
  const [chatBlocked, setChatBlocked] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useChatSidebarToggle();

  const selectConversation = useCallback((id: string | null) => {
    activeConversationIdRef.current = id;
    setActiveConversationId(id);
  }, []);

  // -- Hub questionnaire -----------------------------------------------------
  const [hubQuestionIndex, setHubQuestionIndex] = useState(0);
  const [hubAnswers, setHubAnswers] = useState<HubAnswers>({});

  // Onboarding: which profile steps are still missing
  const needsBusinessRef = useRef(false);
  const needsHubRef = useRef(false);

  const isAsking =
    onboardingStep === "hub" ||
    onboardingStep === "ask_business" ||
    onboardingStep === "ask_company";

  const { bottomRef, resetScroll, scrollToBottomSoon } = useChatAutoScroll(
    messages,
    isAsking,
  );

  // -- Hub flow --------------------------------------------------------------

  /** Shows (and persists) the hub flow from `fromIndex` up to the next question. */
  const startHubFlow = useCallback(
    (convId: string, fromIndex: number, mode: "replace" | "append" = "replace") => {
      const { messages: botMessages, nextQuestionIndex } =
        getNextHubMessages(fromIndex);

      saveMessages({
        conversationId: convId,
        messages: botMessages.map(toSaved),
        hubQuestionIndex: nextQuestionIndex,
      });

      setMessages((prev) =>
        mode === "append" ? [...prev, ...botMessages] : botMessages,
      );
      setHubQuestionIndex(nextQuestionIndex);
      setHubAnswers({});
      setOnboardingStep("hub");
    },
    [saveMessages],
  );

  /** Displays a loaded conversation, resuming the hub flow if unfinished. */
  const showConversation = useCallback(
    (convId: string, state: ConversationState) => {
      if (state.hubQuestionIndex === null) {
        setMessages(state.messages);
        setHubAnswers({});
        setOnboardingStep("done");
      } else if (state.messages.length === 0) {
        startHubFlow(convId, 0);
      } else {
        setMessages(state.messages);
        setHubQuestionIndex(state.hubQuestionIndex);
        setHubAnswers(restoreHubAnswers(state.messages));
        setOnboardingStep("hub");
      }
    },
    [startHubFlow],
  );

  const handleHubAnswer = useCallback(
    async (value: number) => {
      const item = HUB_FLOW[hubQuestionIndex];
      const convId = activeConversationIdRef.current;
      if (item?.type !== "question" || !convId) return;

      const label = answerLabel(item, value);
      const answers = { ...hubAnswers, [hubQuestionIndex]: { value, label } };
      setHubAnswers(answers);

      const answerMsg = userMsg(
        `u-hub-${hubQuestionIndex}`,
        label ?? String(value),
      );
      appendMessages(answerMsg);

      const { messages: botMessages, nextQuestionIndex } = getNextHubMessages(
        hubQuestionIndex + 1,
      );

      if (nextQuestionIndex !== -1) {
        // Next question — persist answer + upcoming messages in one write
        saveMessages({
          conversationId: convId,
          messages: [answerMsg, ...botMessages].map(toSaved),
          hubQuestionIndex: nextQuestionIndex,
        });
        appendMessages(...botMessages);
        setHubQuestionIndex(nextQuestionIndex);
        return;
      }

      // Last question — persist closing messages and mark the flow finished
      saveMessages({
        conversationId: convId,
        messages: [
          ...[answerMsg, ...botMessages].map(toSaved),
          { role: "assistant", content: HUB_THANK_YOU_COPY },
        ],
        hubQuestionIndex: null,
      });
      await updateUser({ hubAnalysisDone: true }).catch(console.error);

      appendMessages(
        ...botMessages,
        botMsg(`hub-thanks-${Date.now()}`, HUB_THANK_YOU_COPY),
      );
      setOnboardingStep("done");
      runHubAnalysis({
        hubInput: toHubInput(answersToHubValues(answers)),
        conversationId: convId,
      });
    },
    [hubQuestionIndex, hubAnswers, appendMessages, saveMessages, updateUser, runHubAnalysis],
  );

  // -- Conversations ---------------------------------------------------------

  const switchConversation = useCallback(
    async (convId: string) => {
      if (convId === activeConversationIdRef.current) return;
      setChatBlocked(false);
      selectConversation(convId);
      setMessages([]);
      setHistoryLoading(true);
      resetScroll();

      try {
        const state = await fetchConversation(convId);
        // Ignore if the user switched again while this was loading
        if (activeConversationIdRef.current !== convId) return;
        showConversation(convId, state);
      } catch (err) {
        console.error("[switchConversation]", err);
      } finally {
        if (activeConversationIdRef.current === convId) setHistoryLoading(false);
      }
    },
    [selectConversation, resetScroll, fetchConversation, showConversation],
  );

  const handleNewConversation = useCallback(async () => {
    setChatBlocked(false);
    const conv = await createConversation();
    selectConversation(conv.id);
    startHubFlow(conv.id, 0);
    setHistoryLoading(false);
  }, [createConversation, selectConversation, startHubFlow]);

  /** Opens a conversation coming from /hub/result and comments the analysis once. */
  const openFromAnalysis = useCallback(
    async (convId: string, analysis: DecisionOutput | null) => {
      selectConversation(convId);
      setOnboardingStep("done");

      const state = await fetchConversation(convId);
      setMessages(state.messages);
      setHistoryLoading(false);

      if (!analysis || state.initialAnalysisMessageSentAt) return;

      const sent = await streamReply(convId, formatAnalysisPrompt(analysis), {
        idPrefix: "a-analysis",
        showError: false,
      });
      if (sent) await markInitialAnalysisSent(convId);
    },
    [selectConversation, fetchConversation, streamReply, markInitialAnalysisSent],
  );

  // -- Initial load: decide what to show from profile + conversation list ----

  const initialize = async (
    user: VeltaUser | null,
    convList: ConversationSummary[],
  ) => {
    const missingCompany = !user?.companyName;
    const missingBusiness = !user?.businessType;
    needsBusinessRef.current = missingBusiness;
    needsHubRef.current = user?.hubAnalysisDone !== true;

    // -- Profile incomplete → onboarding questions
    if (missingCompany || missingBusiness) {
      const convId =
        convList.length > 0
          ? convList[convList.length - 1].id
          : (await createConversation()).id;
      selectConversation(convId);

      setMessages([
        botMsg("ob-welcome", ONBOARDING_COPY.welcome),
        missingCompany
          ? botMsg("ob-ask-company", ONBOARDING_COPY.askCompany)
          : botMsg("ob-ask-business", ONBOARDING_COPY.askBusiness),
      ]);
      setOnboardingStep(missingCompany ? "ask_company" : "ask_business");
      setHistoryLoading(false);
      return;
    }

    // -- Returning from /hub/result ("Conversar com Assistente")
    const targetConvId = searchParams.get("conversationId");
    if (searchParams.get("fromAnalysis") === "true" && targetConvId) {
      await openFromAnalysis(targetConvId, takeAnalysisContext());
      return;
    }

    // -- First analysis: welcome message + start the hub flow
    if (convList.length === 0) {
      const conv = await createConversation();
      selectConversation(conv.id);
      setMessages([botMsg("welcome-first", FIRST_TIME_WELCOME_COPY)]);
      startHubFlow(conv.id, 0, "append");
      setHistoryLoading(false);
      return;
    }

    // -- Resume the latest unfinished analysis
    const pending = lastPendingConversation(convList);
    if (pending) {
      selectConversation(pending.id);
      showConversation(pending.id, await fetchConversation(pending.id));
      setHistoryLoading(false);
      return;
    }

    // -- All analyses concluded → welcome back, chat blocked until one is picked
    selectConversation(null);
    setMessages([botMsg("welcome-back", WELCOME_BACK_COPY)]);
    setChatBlocked(true);
    setOnboardingStep("done");
    setHistoryLoading(false);
  };

  // Runs once, as soon as fresh profile + conversation list are available.
  const initializedRef = useRef(false);
  const initialDataReady =
    !userQuery.isPending &&
    !userQuery.isFetching &&
    !conversationsQuery.isPending &&
    !conversationsQuery.isFetching;

  useEffect(() => {
    if (!initialDataReady || initializedRef.current) return;
    initializedRef.current = true;

    initialize(userQuery.data ?? null, conversationsQuery.data ?? []).catch(
      (err) => {
        console.error("[chat init]", err);
        setOnboardingStep("done");
        setHistoryLoading(false);
      },
    );
    // `initialize` reads the latest render's values; it must only run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDataReady]);

  // -- Send message ----------------------------------------------------------

  /** Saves an onboarding answer and moves to the next step. */
  const handleOnboardingAnswer = useCallback(
    async (convId: string, content: string) => {
      const askingCompany = onboardingStep === "ask_company";
      setSavingOnboarding(true);
      await updateUser(
        askingCompany ? { companyName: content } : { businessType: content },
      ).catch(console.error);

      if (askingCompany && needsBusinessRef.current) {
        appendMessages(
          botMsg(
            `ob-ask-business-${Date.now()}`,
            ONBOARDING_COPY.askBusinessAfterCompany,
          ),
        );
        setOnboardingStep("ask_business");
      } else if (needsHubRef.current) {
        startHubFlow(convId, 0, "append");
      } else {
        appendMessages(botMsg(`ob-done-${Date.now()}`, ONBOARDING_COPY.done));
        setOnboardingStep("done");
      }
      setSavingOnboarding(false);
    },
    [onboardingStep, updateUser, appendMessages, startHubFlow],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const convId = activeConversationIdRef.current;
      // Free text is disabled while answering the hub questionnaire
      if (loading || !convId || onboardingStep === "hub") return;

      appendMessages(userMsg(`u-${Date.now()}`, content));
      if (!isAsking) scrollToBottomSoon();

      if (onboardingStep === "ask_company" || onboardingStep === "ask_business") {
        await handleOnboardingAnswer(convId, content);
        return;
      }

      await streamReply(convId, content, { idPrefix: "a", showError: true });
    },
    [
      loading,
      onboardingStep,
      isAsking,
      appendMessages,
      scrollToBottomSoon,
      handleOnboardingAnswer,
      streamReply,
    ],
  );

  // -- Render ----------------------------------------------------------------

  const allMessages = streamingMessage ? [...messages, streamingMessage] : messages;
  const isOnboarding = onboardingStep !== "done" && onboardingStep !== "loading";
  const sidebarProps = { conversations, activeConversationId };

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "var(--canvas)" }}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside
          className="hidden md:flex shrink-0 w-60 border-r flex-col overflow-hidden"
          style={{
            background: "var(--surface-0)",
            borderColor: "var(--steel-soft)",
          }}
        >
          <ConversationsSidebar
            {...sidebarProps}
            onNew={handleNewConversation}
            onSelect={switchConversation}
          />
        </aside>

        {/* Sidebar — mobile drawer */}
        <Drawer
          open={chatSidebarOpen}
          onClose={() => setChatSidebarOpen(false)}
          side="left"
          ariaLabel="Conversas"
        >
          <ConversationsSidebar
            {...sidebarProps}
            onNew={() => {
              setChatSidebarOpen(false);
              handleNewConversation();
            }}
            onSelect={(id) => {
              setChatSidebarOpen(false);
              switchConversation(id);
            }}
          />
        </Drawer>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {onboardingStep === "loading" || historyLoading ? (
                <div className="flex justify-center py-12">
                  <Text variant="caption" color="tertiary">
                    Carregando...
                  </Text>
                </div>
              ) : allMessages.length === 0 ? (
                <EmptyChatState />
              ) : (
                allMessages.map((msg, i) => {
                  const hubQuestion = hubQuestionForMessage(msg);
                  const answer = hubQuestion
                    ? hubAnswers[hubQuestion.index]
                    : undefined;
                  const isCurrentQuestion =
                    !!hubQuestion &&
                    onboardingStep === "hub" &&
                    hubQuestion.index === hubQuestionIndex &&
                    !answer;

                  return (
                    <div key={msg.id}>
                      <MessageBubble
                        message={msg}
                        isStreaming={
                          streamingMessage !== null &&
                          i === allMessages.length - 1 &&
                          msg.role === "assistant"
                        }
                        userImage={session?.user?.image}
                        userName={session?.user?.name}
                      />
                      {hubQuestion && (isCurrentQuestion || answer) && (
                        <HubQuestionInput
                          question={hubQuestion.item}
                          answer={answer}
                          onAnswer={handleHubAnswer}
                        />
                      )}
                    </div>
                  );
                })
              )}
              {hubAnalysis.isError && <HubAnalysisError />}
              <div ref={bottomRef} />
            </div>
          </main>

          <ChatComposer
            hubMode={onboardingStep === "hub"}
            onboarding={isOnboarding}
            loading={loading}
            disabled={loading || onboardingStep === "loading" || chatBlocked}
            onSend={sendMessage}
          />
        </div>
      </div>

      {(hubAnalysis.isPending || hubAnalysis.isSuccess) && (
        <HubAnalysisOverlay status={hubAnalysis.isPending ? "loading" : "done"} />
      )}
    </div>
  );
}
