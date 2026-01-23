export interface ParsedVoiceCommand {
    amount: number | null;
    category: string;
    merchant: string;
    type: 'debit' | 'credit';
    paymentMethod: string;
    originalTranscript: string;
}

// Map common Hinglish/English terms to categories
const CATEGORY_KEYWORDS: Record<string, string> = {
    // Groceries
    'grocery': 'Groceries',
    'groceries': 'Groceries',
    'rashan': 'Groceries',
    'sabzi': 'Groceries',
    'vegetable': 'Groceries',
    'dudh': 'Groceries',
    'milk': 'Groceries',

    // Transport
    'auto': 'Transport',
    'cab': 'Transport',
    'taxi': 'Transport',
    'uber': 'Transport',
    'ola': 'Transport',
    'petrol': 'Transport',
    'fuel': 'Transport',
    'gaadi': 'Transport',
    'bus': 'Transport',
    'metro': 'Transport',

    // Food
    'food': 'Food & Dining',
    'khaa': 'Food & Dining',
    'dinner': 'Food & Dining',
    'lunch': 'Food & Dining',
    'breakfast': 'Food & Dining',
    'restaurant': 'Food & Dining',
    'swiggy': 'Food & Dining',
    'zomato': 'Food & Dining',
    'chai': 'Food & Dining',
    'coffee': 'Food & Dining',
    'tea': 'Food & Dining',
    'sutta': 'Food & Dining',
    'cigarette': 'Food & Dining',

    // Bills
    'bill': 'Bills',
    'electricity': 'Bills',
    'bijli': 'Bills',
    'recharge': 'Bills',
    'mobile': 'Bills',
    'wifi': 'Bills',
    'internet': 'Bills',

    // Entertainment
    'movie': 'Entertainment',
    'film': 'Entertainment',
    'cinema': 'Entertainment',
    'party': 'Entertainment',

    // Health
    'medicine': 'Healthcare',
    'davai': 'Healthcare',
    'doctor': 'Healthcare',
    'hospital': 'Healthcare',

    // Shopping
    'shopping': 'Shopping',
    'clothes': 'Shopping',
    'kapda': 'Shopping',
    'amazon': 'Shopping',
    'flipkart': 'Shopping',

    // Rent
    'rent': 'Rent',
    'kiraya': 'Rent',
};

export const parseVoiceCommand = (transcript: string): ParsedVoiceCommand => {
    const lowerText = transcript.toLowerCase();

    // 1. Detect Amount (looks for numbers)
    // Matches "50", "500", "1.5k" (maybe later), currently simple integers
    const amountMatch = lowerText.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[0]) : null;

    // 2. Detect Type (Credit vs Debit) 
    // Default is debit. If "mila" or "received" or "income", it's credit.
    let type: 'debit' | 'credit' = 'debit';
    if (lowerText.includes('mila') || lowerText.includes('received') || lowerText.includes('income') || lowerText.includes('credits')) {
        type = 'credit';
    }

    // 3. Detect Category
    let category = 'Groceries'; // Default fallback
    let foundKeyword = '';

    for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
        if (lowerText.includes(keyword)) {
            category = cat;
            foundKeyword = keyword;
            break;
        }
    }

    // 4. Detect Payment Method
    let paymentMethod = 'Cash'; // Default
    if (lowerText.includes('upi') || lowerText.includes('gpay') || lowerText.includes('phonepe') || lowerText.includes('paytm') || lowerText.includes('scan')) {
        paymentMethod = 'UPI';
    } else if (lowerText.includes('card') || lowerText.includes('credit card') || lowerText.includes('debit card')) {
        paymentMethod = 'Card';
    } else if (lowerText.includes('bank') || lowerText.includes('transfer')) {
        paymentMethod = 'Bank Transfer';
    }

    // 5. Extract Merchant/Description
    // Remove the amount and the keyword to leave the "rest" as the description
    let cleanText = lowerText;
    if (amount) {
        cleanText = cleanText.replace(amount.toString(), '');
    }
    if (foundKeyword) {
        cleanText = cleanText.replace(foundKeyword, '');
    }

    // Remove payment method keywords from description
    cleanText = cleanText.replace(/\b(upi|gpay|phonepe|paytm|cash|card|bank)\b/g, '');

    // Remove common filler words (Expanded Hindi/Hinglish support)
    const fillers = [
        'rupees', 'rupya', 'rs', 'in', 'on', 'at', 'to', 'for', 'via', 'by', 'paid',
        'ka', 'ke', 'ko', 'se', 'hai', 'he', 'tha', 'thi', 'diya', 'liya', 'dala', 'bheja', 'transfer'
    ];
    const fillerRegex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
    cleanText = cleanText.replace(fillerRegex, '');

    // Clean up extra spaces
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    // Smart Merchant/Description Logic
    let merchant = 'General Expense';

    if (cleanText.length > 0) {
        // If we have remaining text, that's our best guess for merchant/notes
        merchant = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    } else if (foundKeyword) {
        // Fallback to the category keyword if no text remains (e.g. just said "Auto 50")
        merchant = foundKeyword.charAt(0).toUpperCase() + foundKeyword.slice(1);
    }

    return {
        amount,
        category,
        merchant,
        type,
        paymentMethod,
        originalTranscript: transcript
    };
};
