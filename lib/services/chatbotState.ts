/**
 * Chatbot Conversation State Manager
 * 
 * Manages per-customer conversation state for the WhatsApp ordering bot.
 * Uses an in-memory Map with TTL-based expiry (30 minutes of inactivity).
 */

// ─── Types ─────────────────────────────────────────────────

export type ConversationStep =
  | 'IDLE'
  | 'GREETING'
  | 'MAIN_MENU'
  | 'MENU_CATEGORIES'
  | 'CATEGORY_VIEW'
  | 'CART_VIEW'
  | 'CHECKOUT_TYPE'
  | 'COLLECT_NAME'
  | 'COLLECT_PHONE'
  | 'COLLECT_ADDRESS'
  | 'COLLECT_INSTRUCTIONS'
  | 'COLLECT_PICKUP_TIME'
  | 'COLLECT_DINEIN_GUESTS'
  | 'COLLECT_DINEIN_ARRIVAL'
  | 'COLLECT_DINEIN_OCCASION'
  | 'LOYALTY_CHECK'
  | 'PAYMENT_METHOD'
  | 'ORDER_SUMMARY'
  | 'ORDER_PLACED'
  | 'CHECK_HISTORY_PHONE'
  | 'VIEW_HISTORY'
  | 'CHECK_LOYALTY_PHONE'
  | 'VIEW_LOYALTY'
  | 'RESTAURANT_INFO'
  | 'HUMAN_HANDOFF'
  | 'OFFERS'
  | 'SELECT_VARIANT';

export interface CartItem {
  menuItemId: string;
  itemName: string;
  itemType: 'VEG' | 'NON_VEG';
  basePrice: number;
  variantName?: string;
  variantPrice?: number;
  addonsPrice: number;
  quantity: number;
  addOns: { addonName: string; addonPrice: number; quantity: number }[];
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  deliveryInstructions: string;
  email?: string;
}

export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

export type PaymentMethod = 'UPI' | 'CARD' | 'COD' | 'LINK';

export interface ConversationState {
  step: ConversationStep;
  cart: CartItem[];
  customerInfo: CustomerInfo;
  orderType: OrderType | null;
  paymentMethod: PaymentMethod | null;
  currentCategoryId: string | null;
  currentCategoryName: string | null;
  loyaltyPoints: number;
  loyaltyDiscount: number;
  useLoyalty: boolean;
  guestCount: number;
  arrivalTime: string;
  occasion: string;
  pickupTime: string;
  lastActivity: number;
  messageCount: number;
  pendingItem?: {
    item: any;
    quantity: number;
  };
}

// ─── Defaults ──────────────────────────────────────────────

const DEFAULT_STATE: ConversationState = {
  step: 'IDLE',
  cart: [],
  customerInfo: {
    name: '',
    phone: '',
    address: '',
    deliveryInstructions: '',
  },
  orderType: null,
  paymentMethod: null,
  currentCategoryId: null,
  currentCategoryName: null,
  loyaltyPoints: 0,
  loyaltyDiscount: 0,
  useLoyalty: false,
  guestCount: 0,
  arrivalTime: '',
  occasion: '',
  pickupTime: '',
  lastActivity: Date.now(),
  messageCount: 0,
};

// ─── State Manager ─────────────────────────────────────────

const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // cleanup every 5 minutes

class ChatbotStateManager {
  private states: Map<string, ConversationState> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  /**
   * Get or create conversation state for a phone number
   */
  getState(phone: string): ConversationState {
    const existing = this.states.get(phone);
    if (existing) {
      // Check TTL
      if (Date.now() - existing.lastActivity > STATE_TTL_MS) {
        // Expired — reset
        this.states.delete(phone);
        return this.createState(phone);
      }
      return existing;
    }
    return this.createState(phone);
  }

  /**
   * Update conversation state
   */
  updateState(phone: string, updates: Partial<ConversationState>): ConversationState {
    const current = this.getState(phone);
    const updated: ConversationState = {
      ...current,
      ...updates,
      lastActivity: Date.now(),
      messageCount: current.messageCount + 1,
    };
    this.states.set(phone, updated);
    return updated;
  }

  /**
   * Reset conversation to initial state
   */
  resetState(phone: string): ConversationState {
    const fresh = { ...DEFAULT_STATE, lastActivity: Date.now() };
    this.states.set(phone, fresh);
    return fresh;
  }

  /**
   * Clear cart only (keep other state)
   */
  clearCart(phone: string): void {
    const state = this.getState(phone);
    state.cart = [];
    state.lastActivity = Date.now();
    this.states.set(phone, state);
  }

  /**
   * Add item to cart
   */
  addToCart(phone: string, item: CartItem): void {
    const state = this.getState(phone);
    const existingIdx = state.cart.findIndex(
      (ci) =>
        ci.menuItemId === item.menuItemId &&
        ci.variantName === item.variantName &&
        JSON.stringify(ci.addOns) === JSON.stringify(item.addOns)
    );

    if (existingIdx >= 0) {
      state.cart[existingIdx].quantity += item.quantity;
    } else {
      state.cart.push({ ...item });
    }
    state.lastActivity = Date.now();
    this.states.set(phone, state);
  }

  /**
   * Remove item from cart by index (1-based)
   */
  removeFromCart(phone: string, index: number): boolean {
    const state = this.getState(phone);
    if (index < 1 || index > state.cart.length) return false;
    state.cart.splice(index - 1, 1);
    state.lastActivity = Date.now();
    this.states.set(phone, state);
    return true;
  }

  /**
   * Check if a conversation exists and is active
   */
  hasActiveConversation(phone: string): boolean {
    const state = this.states.get(phone);
    if (!state) return false;
    return Date.now() - state.lastActivity <= STATE_TTL_MS;
  }

  /**
   * Get active conversation count (for monitoring)
   */
  getActiveCount(): number {
    let count = 0;
    const now = Date.now();
    for (const [, state] of this.states) {
      if (now - state.lastActivity <= STATE_TTL_MS) count++;
    }
    return count;
  }

  // ─── Internal ────────────────────────────────────────────

  private createState(phone: string): ConversationState {
    const state: ConversationState = { ...DEFAULT_STATE, lastActivity: Date.now() };
    this.states.set(phone, state);
    return state;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [phone, state] of this.states) {
      if (now - state.lastActivity > STATE_TTL_MS) {
        this.states.delete(phone);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[ChatbotState] Cleaned up ${cleaned} expired conversations. Active: ${this.states.size}`);
    }
  }

  /**
   * Destroy the manager (for cleanup on shutdown)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.states.clear();
  }
}

// Export singleton instance
export const chatbotState = new ChatbotStateManager();
