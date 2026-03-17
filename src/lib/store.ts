import { create } from "zustand";
import type { User, Transaction, Receipt, Account, Invoice, ChatMessage } from "./supabase/types";

interface AppState {
  user: User | null;
  accounts: Account[];
  transactions: Transaction[];
  receipts: Receipt[];
  invoices: Invoice[];
  chatMessages: ChatMessage[];
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setReceipts: (receipts: Receipt[]) => void;
  addReceipt: (receipt: Receipt) => void;
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  accounts: [],
  transactions: [],
  receipts: [],
  invoices: [],
  chatMessages: [],
  isLoading: false,

  setUser: (user) => set({ user }),
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) =>
    set((state) => ({ receipts: [receipt, ...state.receipts] })),
  setInvoices: (invoices) => set({ invoices }),
  addInvoice: (invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setLoading: (isLoading) => set({ isLoading }),
}));
