const SPAM_TRIGGERS = [
    "100% free", "act now", "apply now", "as seen on", "bad credit", "bargain", "best price",
    "big bucks", "billing", "bonus", "bulk email", "buy direct", "call now", "cancel at any time",
    "cash", "casino", "cheap", "click here", "collect", "compare rates", "confidential",
    "congratulations", "credit card", "crypto", "deal", "debt", "discount", "double your",
    "earn", "exclusive deal", "expire", "fast cash", "financial freedom", "free access",
    "free gift", "free info", "free money", "free preview", "free trial", "full refund",
    "get it now", "get paid", "giveaway", "guarantee", "hello", "hidden assets", "home based",
    "income", "increase sales", "incredible deal", "info you requested", "investment",
    "junk", "limited time", "loans", "lose weight", "lowest price", "luxury", "make money",
    "marketing", "mass email", "medicine", "million", "miracle", "money back", "mortgage",
    "multi-level marketing", "name brand", "new customers only", "no catch", "no cost",
    "no credit check", "no fees", "no gimmick", "no hidden costs", "no investment",
    "no obligation", "no purchase necessary", "no questions asked", "no strings attached",
    "off shore", "offer", "online biz", "online degree", "opportunity", "order now",
    "passwords", "pharmacy", "please read", "potential earnings", "pre-approved", "prize",
    "promise", "pure profit", "quote", "rates", "refinance", "refund", "remove",
    "request", "risk-free", "satisfaction", "save big", "save money", "score",
    "search engine listings", "security", "sign up free", "social security", "spam",
    "special promotion", "stock alert", "stop", "subscribe", "success", "supplies",
    "take action", "terms", "the best", "this isn't spam", "time limited", "traffic",
    "trial", "undisclosed recipient", "urgent", "us dollars", "vacation", "valium",
    "viagra", "vicodin", "warranty", "we hate spam", "web traffic", "weight loss",
    "what are you waiting for", "while supplies last", "will not believe your eyes",
    "winner", "winning", "work from home", "xanax", "you are a winner", "your family"
];

export function checkContentSafety(subject: string, body: string): { safe: boolean; triggers: string[] } {
    const content = (subject + " " + body).toLowerCase();
    const triggers: string[] = [];

    for (const trigger of SPAM_TRIGGERS) {
        // Simple substring check - can be improved with regex for word boundaries
        if (content.includes(trigger)) {
            triggers.push(trigger);
        }
    }

    return {
        safe: triggers.length === 0,
        triggers
    };
}
