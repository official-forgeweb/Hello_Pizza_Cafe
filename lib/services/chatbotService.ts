/**
 * Chatbot Service — Main Message Handler
 * 
 * This is the "brain" of the WhatsApp ordering bot. It receives incoming
 * messages, processes them through the conversation state machine, and
 * returns the appropriate response text.
 * 
 * Implements the full conversation flow:
 * Greeting → Menu Browse → Add to Cart → Checkout → Info Collection →
 * Loyalty Check → Payment → Order Summary → Order Placement
 */

import {
  chatbotState,
  ConversationState,
  CartItem,
  ConversationStep,
} from './chatbotState';
import {
  formatCategoriesMessage,
  formatCategoryItemsMessage,
  formatFullMenuMessage,
  findMenuItemInCategory,
  getCategoryByIndex,
  getCategoryCount,
  formatPrice,
} from './menuHelper';
import {
  formatCartMessage,
  formatOrderSummary,
  calculateOrderTotals,
  createOrderFromBot,
} from './chatbotOrderService';
import {
  getOrderHistory,
  getOrderStatus,
  getReorderItems,
} from './chatbotHistoryService';
import { CustomerService } from './customerService';
import prisma from '@/lib/prisma';

// ─── Constants ─────────────────────────────────────────────

const GREETING_PATTERNS = /^(hi|hello|hey|hii|hiii|yo|sup|hola|namaste|namaskar|namaskaar|kaise ho|kya hal|helo|hlw|hiiii|hellooo)/i;
const HINGLISH_YES = /^(yes|y|haan|ha|hnji|ji|ok|okay|sure|thik|theek|chalega|done|confirm)/i;
const HINGLISH_NO = /^(no|n|nahi|naa|nope|cancel|nhi|na)/i;

const RESTAURANT_NAME = 'Hello Pizza Cafe';

// ─── Main Entry Point ──────────────────────────────────────

/**
 * Process an incoming WhatsApp message and return the response text
 */
export async function handleIncomingMessage(
  phone: string,
  messageText: string
): Promise<string> {
  try {
    const text = messageText.trim();
    const textLower = text.toLowerCase();

    // Get current state
    const state = chatbotState.getState(phone);

    // ─── Global Keywords (always active) ─────────────
    const keywordResponse = await handleGlobalKeywords(phone, textLower, state);
    if (keywordResponse) return keywordResponse;

    // ─── Step-based processing ───────────────────────
    return await processStep(phone, text, textLower, state);
  } catch (error) {
    console.error('[Chatbot] Error handling message:', error);
    return '😔 Oops! Something went wrong on our end. Please try again or type *HELP* to see options.';
  }
}

// ─── Global Keyword Handlers ───────────────────────────────

async function handleGlobalKeywords(
  phone: string,
  textLower: string,
  state: ConversationState
): Promise<string | null> {
  // RESTART — always reset
  if (textLower === 'restart' || textLower === 'start over') {
    chatbotState.resetState(phone);
    return getWelcomeMessage();
  }

  // HELP — show main options
  if (textLower === 'help' || textLower === 'options') {
    chatbotState.updateState(phone, { step: 'MAIN_MENU' });
    return getWelcomeMessage();
  }

  // MENU — go to menu categories
  if (textLower === 'menu' || textLower === 'browse' || textLower === 'food') {
    chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
    return await formatCategoriesMessage();
  }

  // CART — view cart
  if (textLower === 'cart' || textLower === 'view cart' || textLower === 'my cart') {
    chatbotState.updateState(phone, { step: 'CART_VIEW' });
    return formatCartMessage(chatbotState.getState(phone));
  }

  // ORDER — go to checkout
  if (textLower === 'order' || textLower === 'checkout' || textLower === 'place order') {
    if (state.cart.length === 0) {
      return '🛒 Your cart is empty! Type *MENU* to browse our menu and add items first. 😊';
    }
    chatbotState.updateState(phone, { step: 'CHECKOUT_TYPE' });
    return getCheckoutTypeMessage();
  }

  // POINTS — check loyalty
  if (textLower === 'points' || textLower === 'loyalty' || textLower === 'my points') {
    chatbotState.updateState(phone, { step: 'CHECK_LOYALTY_PHONE' });
    return '⭐ *Your Loyalty Points*\n\nPlease share your *10-digit mobile number* to check 📱';
  }

  // TRACK — track order
  if (textLower.startsWith('track')) {
    const orderNum = textLower.replace('track', '').trim();
    if (orderNum) {
      return await getOrderStatus(orderNum);
    }
    return '🔍 *Track Your Order*\n\nPlease type *TRACK* followed by your order number.\nExample: *TRACK 260626501*';
  }

  // OFFERS — show today's offers
  if (textLower === 'offers' || textLower === 'deals' || textLower === 'offer') {
    return await getOffersMessage();
  }

  // CANCEL — cancel current order process
  if (textLower === 'cancel') {
    if (state.step === 'IDLE' || state.step === 'MAIN_MENU' || state.step === 'GREETING') {
      return "You don't have an active order to cancel. Type *HELP* to see options! 😊";
    }
    chatbotState.resetState(phone);
    return '❌ Your current order has been cancelled.\n\nType *MENU* to start a new order or *HELP* to see all options. 😊';
  }

  return null; // No keyword matched
}

// ─── Step-based Message Processing ─────────────────────────

async function processStep(
  phone: string,
  text: string,
  textLower: string,
  state: ConversationState
): Promise<string> {
  switch (state.step) {
    case 'IDLE':
      return handleIdle(phone, text, textLower);

    case 'MAIN_MENU':
    case 'GREETING':
      return handleMainMenu(phone, textLower);

    case 'MENU_CATEGORIES':
      return await handleMenuCategories(phone, textLower);

    case 'CATEGORY_VIEW':
      return await handleCategoryView(phone, text, textLower, state);

    case 'CART_VIEW':
      return await handleCartView(phone, textLower, state);

    case 'CHECKOUT_TYPE':
      return handleCheckoutType(phone, textLower);

    case 'COLLECT_NAME':
      return handleCollectName(phone, text);

    case 'COLLECT_PHONE':
      return await handleCollectPhone(phone, text);

    case 'COLLECT_ADDRESS':
      return handleCollectAddress(phone, text);

    case 'COLLECT_INSTRUCTIONS':
      return await handleCollectInstructions(phone, text, textLower);

    case 'COLLECT_PICKUP_TIME':
      return handleCollectPickupTime(phone, text, textLower);

    case 'COLLECT_DINEIN_GUESTS':
      return handleCollectDineInGuests(phone, text);

    case 'COLLECT_DINEIN_ARRIVAL':
      return handleCollectDineInArrival(phone, text, textLower);

    case 'COLLECT_DINEIN_OCCASION':
      return handleCollectDineInOccasion(phone, text, textLower);

    case 'LOYALTY_CHECK':
      return handleLoyaltyCheck(phone, textLower);

    case 'PAYMENT_METHOD':
      return handlePaymentMethod(phone, textLower);

    case 'ORDER_SUMMARY':
      return await handleOrderSummary(phone, textLower);

    case 'ORDER_PLACED':
      return handleOrderPlaced(phone, textLower);

    case 'CHECK_HISTORY_PHONE':
      return await handleCheckHistoryPhone(phone, text);

    case 'VIEW_HISTORY':
      return await handleViewHistory(phone, textLower);

    case 'CHECK_LOYALTY_PHONE':
      return await handleCheckLoyaltyPhone(phone, text);

    case 'VIEW_LOYALTY':
      return handleViewLoyalty(phone, textLower);

    case 'RESTAURANT_INFO':
      return handleRestaurantInfo(phone, textLower);

    default:
      return handleIdle(phone, text, textLower);
  }
}

// ─── Step Handlers ─────────────────────────────────────────

function handleIdle(phone: string, text: string, textLower: string): string {
  if (GREETING_PATTERNS.test(textLower)) {
    chatbotState.updateState(phone, { step: 'MAIN_MENU' });
    return getWelcomeMessage();
  }

  // If someone sends a number or text we don't understand in IDLE
  chatbotState.updateState(phone, { step: 'MAIN_MENU' });
  return getWelcomeMessage();
}

function handleMainMenu(phone: string, textLower: string): string {
  switch (textLower) {
    case '1':
    case 'browse':
    case 'menu':
    case 'order':
      chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
      return ''; // Will be handled by keyword
    case '2':
    case 'previous':
    case 'history':
      chatbotState.updateState(phone, { step: 'CHECK_HISTORY_PHONE' });
      return '📦 *Your Previous Orders*\n\nPlease share your *10-digit mobile number* 📱';
    case '3':
    case 'points':
    case 'loyalty':
      chatbotState.updateState(phone, { step: 'CHECK_LOYALTY_PHONE' });
      return '⭐ *Your Loyalty Points*\n\nPlease share your *10-digit mobile number* to check 📱';
    case '4':
    case 'info':
    case 'timings':
      chatbotState.updateState(phone, { step: 'RESTAURANT_INFO' });
      return getRestaurantInfoMessage();
    case '5':
    case 'offers':
    case 'deals':
      return ''; // Will be handled by keyword
    case '6':
    case 'support':
    case 'human':
      return getHumanHandoffMessage();
    default:
      // Try to match as menu browsing
      chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
      return formatCategoriesMessage() as unknown as string;
  }
}

async function handleMenuCategories(phone: string, textLower: string): Promise<string> {
  const catCount = await getCategoryCount();
  const num = parseInt(textLower);

  // Check if it's a valid category number
  if (!isNaN(num)) {
    // "View Full Menu" option
    if (num === catCount + 1) {
      return await formatFullMenuMessage();
    }

    // "Go to Cart" option
    if (num === catCount + 2) {
      chatbotState.updateState(phone, { step: 'CART_VIEW' });
      return formatCartMessage(chatbotState.getState(phone));
    }

    // Category selection
    const cat = await getCategoryByIndex(num);
    if (cat) {
      chatbotState.updateState(phone, {
        step: 'CATEGORY_VIEW',
        currentCategoryId: cat.id,
        currentCategoryName: cat.name,
      });
      return await formatCategoryItemsMessage(cat.id, cat.name);
    }
  }

  return `🤔 Please enter a valid category number (1-${catCount + 2}).\n\n` +
    await formatCategoriesMessage();
}

async function handleCategoryView(
  phone: string,
  text: string,
  textLower: string,
  state: ConversationState
): Promise<string> {
  if (!state.currentCategoryId) {
    chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
    return await formatCategoriesMessage();
  }

  // Try to find and add menu item
  const result = await findMenuItemInCategory(state.currentCategoryId, text);

  if (result) {
    const { item, quantity } = result;

    const cartItem: CartItem = {
      menuItemId: item.id,
      itemName: item.name,
      itemType: item.itemType,
      basePrice: item.basePrice,
      variantName: item.variants.length > 0 ? item.variants[0].name : undefined,
      variantPrice: item.variants.length > 0 ? item.variants[0].price : undefined,
      addonsPrice: 0,
      quantity,
      addOns: [],
    };

    chatbotState.addToCart(phone, cartItem);

    const effectivePrice = cartItem.variantPrice && cartItem.variantPrice > 0
      ? cartItem.variantPrice
      : cartItem.basePrice;
    const totalItems = chatbotState.getState(phone).cart.reduce((sum, i) => sum + i.quantity, 0);

    let msg = `✅ Added *${item.name}* x${quantity} (${formatPrice(effectivePrice * quantity)}) to your cart!\n\n`;
    msg += `🛒 Cart: ${totalItems} item${totalItems > 1 ? 's' : ''}\n\n`;
    msg += '➕ Add more items from this category\n';
    msg += 'Type *MENU* for other categories\n';
    msg += 'Type *CART* to view cart & checkout 🛒';

    return msg;
  }

  // If not an item, check if user typed a number that doesn't match
  return `🤔 I couldn't find that item. Please type the *item number* or *name* from the menu above.\n\nExample: *1 x 2* (item 1, quantity 2)\n\nType *MENU* to see categories again.`;
}

async function handleCartView(
  phone: string,
  textLower: string,
  state: ConversationState
): Promise<string> {
  switch (textLower) {
    case '1':
    case 'checkout':
    case 'proceed':
      if (state.cart.length === 0) {
        return '🛒 Your cart is empty! Type *MENU* to add items first.';
      }
      chatbotState.updateState(phone, { step: 'CHECKOUT_TYPE' });
      return getCheckoutTypeMessage();

    case '2':
    case 'add':
    case 'more':
      chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
      return await formatCategoriesMessage();

    case '3':
    case 'remove':
      if (state.cart.length === 0) {
        return '🛒 Your cart is empty! Nothing to remove.';
      }
      return 'Which item would you like to remove? Type the *item number* from your cart (1, 2, 3...).';

    case '4':
    case 'clear':
      chatbotState.clearCart(phone);
      return '🗑️ Cart cleared!\n\nType *MENU* to start fresh. 😊';

    default:
      // Check if user is trying to remove an item by number
      const removeNum = parseInt(textLower);
      if (!isNaN(removeNum) && removeNum >= 1 && removeNum <= state.cart.length) {
        const removedItem = state.cart[removeNum - 1];
        chatbotState.removeFromCart(phone, removeNum);
        return `❌ Removed *${removedItem.itemName}* from cart.\n\n` +
          formatCartMessage(chatbotState.getState(phone));
      }

      return formatCartMessage(state);
  }
}

function handleCheckoutType(phone: string, textLower: string): string {
  switch (textLower) {
    case '1':
    case 'delivery':
    case 'home':
      chatbotState.updateState(phone, {
        step: 'COLLECT_NAME',
        orderType: 'DELIVERY',
      });
      return '📝 Let\'s get your delivery details!\n\n*What is your full name?* 👤';

    case '2':
    case 'pickup':
    case 'takeaway':
      chatbotState.updateState(phone, {
        step: 'COLLECT_NAME',
        orderType: 'PICKUP',
      });
      return '🏃 *Pickup Order Details*\n\n*What is your full name?* 👤';

    case '3':
    case 'dine':
    case 'dine in':
    case 'dinein':
      chatbotState.updateState(phone, {
        step: 'COLLECT_NAME',
        orderType: 'DINE_IN',
      });
      return '🍽️ *Dine In Order Details*\n\n*What is your full name?* 👤';

    default:
      return getCheckoutTypeMessage();
  }
}

function handleCollectName(phone: string, text: string): string {
  const name = text.trim();
  if (name.length < 2) {
    return '❌ Please enter a valid name (at least 2 characters). 👤';
  }

  const state = chatbotState.updateState(phone, {
    step: 'COLLECT_PHONE',
    customerInfo: {
      ...chatbotState.getState(phone).customerInfo,
      name,
    },
  });

  return `Thanks *${name}*! 😊\n\n*What is your 10-digit mobile number?* 📱\n(For order updates)`;
}

async function handleCollectPhone(phone: string, text: string): Promise<string> {
  const cleaned = text.replace(/\D/g, '');

  // Accept 10-digit or 12-digit (with 91 prefix)
  let finalPhone = cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    finalPhone = cleaned.substring(2);
  }

  if (finalPhone.length !== 10) {
    return '❌ Please enter a valid *10-digit mobile number*.\nExample: *9876543210*';
  }

  const state = chatbotState.getState(phone);

  chatbotState.updateState(phone, {
    customerInfo: {
      ...state.customerInfo,
      phone: finalPhone,
    },
  });

  // Route based on order type
  if (state.orderType === 'DELIVERY') {
    chatbotState.updateState(phone, { step: 'COLLECT_ADDRESS' });
    return `Perfect! Now please share your *complete delivery address* 🏠\n\nInclude:\n• House/Flat No.\n• Street/Area Name\n• Nearby Landmark\n• City & Pincode\n\nExample: *Flat 204, Sunshine Apartment, Near D-Mart, Andheri West, Mumbai - 400058*`;
  }

  if (state.orderType === 'PICKUP') {
    chatbotState.updateState(phone, { step: 'COLLECT_PICKUP_TIME' });
    return `🕐 *When would you like to pick up?*\n\n🔹 *1. ASAP* (Ready in ~20-25 mins)\n🔹 *2. Schedule* (Tell us your preferred time)`;
  }

  if (state.orderType === 'DINE_IN') {
    chatbotState.updateState(phone, { step: 'COLLECT_DINEIN_GUESTS' });
    return '*How many people are dining?* 👥\n(So we can arrange your table)';
  }

  // Fallback
  chatbotState.updateState(phone, { step: 'LOYALTY_CHECK' });
  return await checkLoyaltyForOrder(phone);
}

function handleCollectAddress(phone: string, text: string): string {
  const address = text.trim();
  if (address.length < 10) {
    return '❌ Please provide a more complete address with house/flat number, street, and landmark.\n\nExample: *Flat 204, Sunshine Apartment, Near D-Mart, Andheri West, Mumbai - 400058*';
  }

  chatbotState.updateState(phone, {
    step: 'COLLECT_INSTRUCTIONS',
    customerInfo: {
      ...chatbotState.getState(phone).customerInfo,
      address,
    },
  });

  return '📍 Got it! One last thing...\n\n*Any specific delivery instructions?*\n(Optional — like gate code, floor, call before delivery)\n\nOr type *SKIP* to continue';
}

async function handleCollectInstructions(
  phone: string,
  text: string,
  textLower: string
): Promise<string> {
  const instructions = textLower === 'skip' || textLower === 'no' ? '' : text.trim();

  chatbotState.updateState(phone, {
    step: 'LOYALTY_CHECK',
    customerInfo: {
      ...chatbotState.getState(phone).customerInfo,
      deliveryInstructions: instructions,
    },
  });

  return await checkLoyaltyForOrder(phone);
}

function handleCollectPickupTime(phone: string, text: string, textLower: string): string {
  let pickupTime = '';

  if (textLower === '1' || textLower === 'asap' || textLower === 'now') {
    pickupTime = 'ASAP (~20-25 mins)';
  } else if (textLower === '2' || textLower === 'schedule') {
    return 'Please type your preferred pickup time.\nExample: *6:30 PM* or *7:00 PM*';
  } else {
    pickupTime = text.trim();
  }

  chatbotState.updateState(phone, {
    step: 'LOYALTY_CHECK',
    pickupTime,
  });

  return checkLoyaltyForOrderSync(phone);
}

function handleCollectDineInGuests(phone: string, text: string): string {
  const guests = parseInt(text.trim());
  if (isNaN(guests) || guests < 1 || guests > 50) {
    return '❌ Please enter a valid number of guests (1-50). 👥';
  }

  chatbotState.updateState(phone, {
    step: 'COLLECT_DINEIN_ARRIVAL',
    guestCount: guests,
  });

  return `🕐 *When are you planning to arrive?*\n\n🔹 *1. I'm already here / Coming in 15 mins*\n🔹 *2. Schedule a time* (Tell us when)`;
}

function handleCollectDineInArrival(phone: string, text: string, textLower: string): string {
  let arrivalTime = '';

  if (textLower === '1' || textLower === 'now' || textLower === 'here') {
    arrivalTime = 'Arriving now / within 15 mins';
  } else if (textLower === '2' || textLower === 'schedule') {
    return 'Please type your expected arrival time.\nExample: *7:00 PM* or *8:30 PM*';
  } else {
    arrivalTime = text.trim();
  }

  chatbotState.updateState(phone, {
    step: 'COLLECT_DINEIN_OCCASION',
    arrivalTime,
  });

  return `🎉 *Any special occasion?*\n\n🔹 *1. Birthday 🎂*\n🔹 *2. Anniversary 💑*\n🔹 *3. Business Meeting 💼*\n🔹 *4. No Special Occasion*\n\n(We'll make it extra special if it's a celebration! 🎊)`;
}

function handleCollectDineInOccasion(phone: string, text: string, textLower: string): string {
  const occasions: Record<string, string> = {
    '1': 'Birthday 🎂',
    '2': 'Anniversary 💑',
    '3': 'Business Meeting 💼',
    '4': 'None',
    'birthday': 'Birthday 🎂',
    'anniversary': 'Anniversary 💑',
    'business': 'Business Meeting 💼',
    'none': 'None',
    'no': 'None',
  };

  const occasion = occasions[textLower] || text.trim();

  chatbotState.updateState(phone, {
    step: 'LOYALTY_CHECK',
    occasion,
  });

  return checkLoyaltyForOrderSync(phone);
}

async function handleLoyaltyCheck(phone: string, textLower: string): Promise<string> {
  const state = chatbotState.getState(phone);

  if (textLower === '1' || HINGLISH_YES.test(textLower)) {
    // Use loyalty points
    chatbotState.updateState(phone, {
      step: 'PAYMENT_METHOD',
      useLoyalty: true,
    });
    return getPaymentMethodMessage();
  }

  if (textLower === '2' || HINGLISH_NO.test(textLower)) {
    // Don't use points
    chatbotState.updateState(phone, {
      step: 'PAYMENT_METHOD',
      useLoyalty: false,
      loyaltyPoints: 0,
      loyaltyDiscount: 0,
    });
    return getPaymentMethodMessage();
  }

  return '⭐ Please select:\n🔹 *1.* Yes, use my points\n🔹 *2.* No, save for later';
}

function handlePaymentMethod(phone: string, textLower: string): string {
  const payments: Record<string, 'UPI' | 'CARD' | 'COD' | 'LINK'> = {
    '1': 'UPI',
    '2': 'CARD',
    '3': 'COD',
    '4': 'LINK',
    'upi': 'UPI',
    'gpay': 'UPI',
    'paytm': 'UPI',
    'phonepe': 'UPI',
    'card': 'CARD',
    'cash': 'COD',
    'cod': 'COD',
    'link': 'LINK',
  };

  const payment = payments[textLower];
  if (!payment) {
    return getPaymentMethodMessage();
  }

  chatbotState.updateState(phone, {
    step: 'ORDER_SUMMARY',
    paymentMethod: payment,
  });

  const state = chatbotState.getState(phone);
  return formatOrderSummary(state);
}

async function handleOrderSummary(phone: string, textLower: string): Promise<string> {
  if (textLower === '1' || textLower === 'confirm' || HINGLISH_YES.test(textLower)) {
    // Place the order!
    const state = chatbotState.getState(phone);
    const result = await createOrderFromBot(state);

    if (result.success) {
      chatbotState.updateState(phone, { step: 'ORDER_PLACED' });

      const eta = state.orderType === 'DELIVERY' ? '35-45' : '20-25';

      let msg = `🎉 *ORDER PLACED SUCCESSFULLY!*\n\n`;
      msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
      msg += `🆔 *Order ID: ${result.orderNumber}*\n`;
      msg += `⏱️ *Estimated Time: ${eta} mins*\n`;
      msg += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
      msg += '✅ Your order has been received by our kitchen!\n';
      msg += "We'll keep you updated right here on WhatsApp.\n\n";

      if (result.pointsEarned && result.pointsEarned > 0) {
        msg += `⭐ You earned *${result.pointsEarned} Loyalty Points* on this order!\n\n`;
      }

      if (state.orderType === 'DELIVERY') {
        msg += '📍 Our delivery partner will call you before arrival.\n\n';
      }

      msg += `Thank you for ordering from *${RESTAURANT_NAME}* 🍽️❤️\n`;
      msg += 'We hope you enjoy your meal!\n\n';

      msg += '🔔 You\'ll receive updates:\n';
      msg += '• When your order is *Confirmed* ✅\n';
      msg += '• When food is *Being Prepared* 👨‍🍳\n';
      if (state.orderType === 'DELIVERY') {
        msg += '• When it\'s *Out for Delivery* 🛵\n';
      }

      // Reset conversation state
      chatbotState.resetState(phone);

      return msg;
    } else {
      return `😔 Sorry, we couldn't place your order right now.\n\nError: ${result.error}\n\nPlease try again or type *HELP* for support.`;
    }
  }

  if (textLower === '2' || textLower === 'edit' || textLower === 'change') {
    chatbotState.updateState(phone, { step: 'CART_VIEW' });
    return formatCartMessage(chatbotState.getState(phone));
  }

  if (textLower === '3' || HINGLISH_NO.test(textLower)) {
    chatbotState.resetState(phone);
    return '❌ Order cancelled.\n\nType *MENU* to start a new order or *HELP* for options. 😊';
  }

  return 'Please select:\n🔹 *1.* Confirm Order\n🔹 *2.* Make Changes\n🔹 *3.* Cancel';
}

function handleOrderPlaced(phone: string, textLower: string): string {
  // After order placed, treat as new conversation
  chatbotState.resetState(phone);
  return getWelcomeMessage();
}

async function handleCheckHistoryPhone(phone: string, text: string): Promise<string> {
  const cleaned = text.replace(/\D/g, '');
  let finalPhone = cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    finalPhone = cleaned.substring(2);
  }

  if (finalPhone.length !== 10) {
    return '❌ Please enter a valid *10-digit mobile number*.\nExample: *9876543210*';
  }

  chatbotState.updateState(phone, { step: 'VIEW_HISTORY' });
  return await getOrderHistory(finalPhone);
}

async function handleViewHistory(phone: string, textLower: string): Promise<string> {
  if (textLower === '1' || textLower === 'reorder') {
    // Get the sender's phone for reorder lookup
    const senderPhone = phone.replace(/\D/g, '');
    const shortPhone = senderPhone.length > 10 ? senderPhone.substring(senderPhone.length - 10) : senderPhone;
    const items = await getReorderItems(shortPhone);

    if (!items || items.length === 0) {
      return 'No previous order found to reorder.\n\nType *MENU* to browse our menu. 😊';
    }

    // Add items to cart
    items.forEach((item) => chatbotState.addToCart(phone, item));
    chatbotState.updateState(phone, { step: 'CART_VIEW' });

    return '🔄 *Last order items loaded into your cart!*\n\n' +
      formatCartMessage(chatbotState.getState(phone));
  }

  if (textLower === '2') {
    chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
    return await formatCategoriesMessage();
  }

  if (textLower === '3') {
    chatbotState.updateState(phone, { step: 'MAIN_MENU' });
    return getWelcomeMessage();
  }

  return 'Please select:\n🔹 *1.* Reorder Last Order\n🔹 *2.* Place New Order\n🔹 *3.* Back to Main Menu';
}

async function handleCheckLoyaltyPhone(phone: string, text: string): Promise<string> {
  const cleaned = text.replace(/\D/g, '');
  let finalPhone = cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    finalPhone = cleaned.substring(2);
  }

  if (finalPhone.length !== 10) {
    return '❌ Please enter a valid *10-digit mobile number*.\nExample: *9876543210*';
  }

  chatbotState.updateState(phone, { step: 'VIEW_LOYALTY' });

  const wallet = await CustomerService.getCustomerLoyaltyWallet(finalPhone);
  const customer = await prisma.customer.findFirst({
    where: { phone: finalPhone },
  });

  const customerName = customer?.name || 'Valued Customer';
  const redeemable = Math.floor(wallet.availablePoints);

  let msg = `⭐ *LOYALTY DASHBOARD*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 ${customerName}\n`;
  msg += `🌟 *Total Points: ${wallet.availablePoints}*\n`;
  msg += `💰 *Redeemable: ${formatPrice(redeemable)} discount*\n`;

  if (wallet.pendingPoints > 0) {
    msg += `⏳ *Pending Points: ${wallet.pendingPoints}* (available after 24hrs)\n`;
  }

  if (wallet.nextExpiryDate) {
    const expiryDate = new Date(wallet.nextExpiryDate as unknown as string);
    const expiryStr = expiryDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    msg += `📅 *Next Expiry: ${expiryStr}*\n`;
  }

  msg += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  msg += '🔹 *1. 🛒 Place New Order & Use Points*\n';
  msg += '🔹 *2. 🏠 Back to Main Menu*';

  return msg;
}

function handleViewLoyalty(phone: string, textLower: string): string {
  if (textLower === '1') {
    chatbotState.updateState(phone, { step: 'MENU_CATEGORIES' });
    return ''; // Will trigger menu keyword
  }

  if (textLower === '2') {
    chatbotState.updateState(phone, { step: 'MAIN_MENU' });
    return getWelcomeMessage();
  }

  return 'Please select:\n🔹 *1.* Place New Order\n🔹 *2.* Back to Main Menu';
}

function handleRestaurantInfo(phone: string, textLower: string): string {
  chatbotState.updateState(phone, { step: 'MAIN_MENU' });
  return getWelcomeMessage();
}

// ─── Message Templates ─────────────────────────────────────

function getWelcomeMessage(): string {
  return `👋 Welcome to *${RESTAURANT_NAME}*!\n\nI'm your personal food assistant 🍽️\nHow can I help you today? Please choose an option:\n\n🔹 *1.* 🍴 Browse Menu & Place Order\n🔹 *2.* 📦 Check My Previous Orders\n🔹 *3.* ⭐ Check My Loyalty Points\n🔹 *4.* 🕐 Restaurant Timings & Info\n🔹 *5.* 🎯 Today's Special Offers\n🔹 *6.* 🙋 Talk to a Human (Support)\n\n👇 Just reply with a number or type your choice!`;
}

function getCheckoutTypeMessage(): string {
  return `Great! 🎉 Let's complete your order.\n\n*How would you like your order?*\n\n🔹 *1. 🏠 Home Delivery*\n   (Delivered to your doorstep)\n\n🔹 *2. 🏃 Pickup / Takeaway*\n   (Pick up from our restaurant)\n\n🔹 *3. 🍽️ Dine In*\n   (Enjoy at our restaurant)\n\n👇 Please select 1, 2, or 3`;
}

function getPaymentMethodMessage(): string {
  return `💳 *Select Payment Method*\n\n🔹 *1. 📱 UPI / GPay / PhonePe / Paytm*\n🔹 *2. 💳 Credit / Debit Card*\n🔹 *3. 💵 Cash on Delivery*\n🔹 *4. 🔗 Pay via Link*\n   (We'll send you a secure payment link)`;
}

function getRestaurantInfoMessage(): string {
  return `🏪 *${RESTAURANT_NAME}*\n━━━━━━━━━━━━━━━━━━━━━━\n🕐 Mon-Sun: 11:00 AM to 11:00 PM\n🚚 Delivery: Available\n💰 Min. Order for Delivery: ₹200\n🆓 Free Delivery: Above ₹500\n🅿️ Accepts: UPI, Cards, Cash\n━━━━━━━━━━━━━━━━━━━━━━\n\nType *MENU* to start ordering! 🍴\nType *HELP* to go back to main menu.`;
}

function getHumanHandoffMessage(): string {
  return `🙋 *Connecting you to our team...*\n\nPlease hold for a moment!\nA team member will join this chat shortly.\n\n⏱️ Expected wait: 2-5 minutes\n\nOr type *MENU* to continue ordering with the bot. 😊`;
}

async function getOffersMessage(): Promise<string> {
  try {
    // Check for active coupons
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      take: 5,
    });

    // Check for featured items
    const featured = await prisma.featuredItem.findMany({
      where: {
        isActive: true,
        displayDate: {
          gte: new Date(now.toISOString().split('T')[0]),
          lt: new Date(new Date(now.toISOString().split('T')[0]).getTime() + 86400000),
        },
      },
      include: {
        menuItem: true,
      },
      take: 3,
    });

    let msg = `🎯 *TODAY'S SPECIAL OFFERS*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (coupons.length === 0 && featured.length === 0) {
      msg += '🎉 No special offers today, but our entire menu is amazing!\n\n';
      msg += 'Type *MENU* to browse and order. 😋';
      return msg;
    }

    if (featured.length > 0) {
      msg += '⭐ *Featured Items:*\n';
      featured.forEach((f) => {
        msg += `  🔥 *${f.menuItem.name}* — ${formatPrice(Number(f.menuItem.basePrice))}\n`;
        if (f.description) msg += `     ${f.description}\n`;
      });
      msg += '\n';
    }

    if (coupons.length > 0) {
      msg += '🏷️ *Available Coupons:*\n';
      coupons.forEach((c) => {
        const discountText = c.discountType === 'PERCENTAGE'
          ? `${c.discountValue}% OFF`
          : `₹${c.discountValue} OFF`;
        msg += `  🎟️ *${c.code}* — ${discountText}`;
        if (Number(c.minimumOrder) > 0) {
          msg += ` (Min: ${formatPrice(Number(c.minimumOrder))})`;
        }
        msg += '\n';
        if (c.description) msg += `     ${c.description}\n`;
      });
      msg += '\n';
    }

    msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += 'Type *MENU* to start ordering! 🍴';

    return msg;
  } catch {
    return `🎯 *TODAY'S OFFERS*\n\nCheck our menu for the latest specials!\n\nType *MENU* to browse. 😋`;
  }
}

// ─── Loyalty Check During Order Flow ───────────────────────

async function checkLoyaltyForOrder(phone: string): Promise<string> {
  const state = chatbotState.getState(phone);
  const customerPhone = state.customerInfo.phone;

  if (!customerPhone) {
    chatbotState.updateState(phone, { step: 'PAYMENT_METHOD' });
    return getPaymentMethodMessage();
  }

  try {
    const wallet = await CustomerService.getCustomerLoyaltyWallet(customerPhone);

    if (wallet.availablePoints > 0) {
      const discount = Math.min(wallet.availablePoints, calculateOrderTotals(state).totalAmount);

      chatbotState.updateState(phone, {
        step: 'LOYALTY_CHECK',
        loyaltyPoints: wallet.availablePoints,
        loyaltyDiscount: discount,
      });

      return `⭐ *Do you want to use your Loyalty Points?*\n\nYou have *${wallet.availablePoints} points* = *${formatPrice(discount)} discount* available!\n\n🔹 *1. Yes, use my ${wallet.availablePoints} points (Save ${formatPrice(discount)})\n🔹 *2. No, save points for later*`;
    }
  } catch {
    // No loyalty data — skip
  }

  chatbotState.updateState(phone, { step: 'PAYMENT_METHOD' });
  return getPaymentMethodMessage();
}

function checkLoyaltyForOrderSync(phone: string): string {
  // For synchronous contexts, just move to payment
  // The actual loyalty check happens async
  chatbotState.updateState(phone, { step: 'PAYMENT_METHOD' });

  // Schedule async loyalty check
  setTimeout(async () => {
    try {
      const state = chatbotState.getState(phone);
      if (state.step !== 'PAYMENT_METHOD') return; // User already moved on

      const customerPhone = state.customerInfo.phone;
      if (!customerPhone) return;

      const wallet = await CustomerService.getCustomerLoyaltyWallet(customerPhone);
      if (wallet.availablePoints > 0) {
        const discount = Math.min(wallet.availablePoints, calculateOrderTotals(state).totalAmount);
        chatbotState.updateState(phone, {
          step: 'LOYALTY_CHECK',
          loyaltyPoints: wallet.availablePoints,
          loyaltyDiscount: discount,
        });
      }
    } catch {
      // Ignore errors
    }
  }, 0);

  return getPaymentMethodMessage();
}
