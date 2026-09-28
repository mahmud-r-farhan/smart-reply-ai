/**
 * Offline Deterministic Heuristics Engine
 * Provides zero-latency (~0ms overhead) smart suggestions, enhancements,
 * translations, and summaries when offline or when cloud LLM is unreachable.
 * Aligned with Google ML Kit Smart Reply, Proofreading & Rewriting heuristics.
 */

// Intent patterns for smart replies
const INTENT_PATTERNS = [
  {
    type: "greeting",
    regex: /\b(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup)\b/i,
    replies: {
      professional: [
        "Hello! Thank you for reaching out. How can I assist you today?",
        "Good day! I hope you are having a productive week.",
        "Hello! Thanks for connecting. What can I do for you?",
        "Greetings! Glad to hear from you."
      ],
      friendly: [
        "Hey there! Great to hear from you! How's everything going?",
        "Hi! Hope your day is going wonderfully! 😊",
        "Hey! Always happy to connect. What's up?",
        "Hello! Hope you're having an awesome day!"
      ],
      casual: [
        "Hey! What's up?",
        "Yo! How's it going?",
        "Hey there, good to hear from you!",
        "Sup! What's on your mind?"
      ],
      formal: [
        "Greetings. Thank you for your correspondence.",
        "Good day. I acknowledge receipt of your message.",
        "Dear colleague, I hope this message finds you well.",
        "Respectfully received. How may I be of service?"
      ],
      flating: [
        "Hey there! You just brightened up my day! 😉",
        "Hello handsome/gorgeous! What pleasant surprise is this?",
        "Hey! Seeing your name pop up always makes me smile.",
        "Hi! You definitely know how to make an entrance."
      ],
      romantic: [
        "Hello my love, thinking of you always warms my heart. ❤️",
        "Hey darling, so happy to hear your voice through your words.",
        "Hi sweetheart, you're the brightest part of my day.",
        "Hello beautiful, my thoughts were already with you."
      ]
    }
  },
  {
    type: "question_status",
    regex: /\b(how are you|how's it going|how have you been|how are things|doing good)\b/i,
    replies: {
      professional: [
        "I'm doing well, thank you for asking. How are things on your end?",
        "All is progressing smoothly here. Thank you for checking in.",
        "Doing well and staying focused. I hope all is well with you too.",
        "Very well, thank you. Ready to collaborate whenever you are."
      ],
      friendly: [
        "Doing great, thanks for asking! How about yourself?",
        "All good on my side! Hope you're having a wonderful week!",
        "Can't complain at all! Things are great. What's new with you?",
        "Doing fantastic! Really appreciate you asking! 😊"
      ],
      casual: [
        "All good here! How about you?",
        "Can't complain! Living the dream. You?",
        "Pretty good, just keeping busy!",
        "Doing alright! How's life on your side?"
      ],
      formal: [
        "I am functioning optimally, thank you. I trust your endeavors are fruitful.",
        "All is well in our department. Thank you for your kind inquiry.",
        "I am doing well and appreciate your courtesy.",
        "In good standing, thank you. I hope the same applies to you."
      ],
      flating: [
        "Much better now that you've messaged me! 😉",
        "Can't complain, especially now that I'm talking to you.",
        "Doing great, but definitely thinking of you!",
        "A whole lot better now! How are you doing?"
      ],
      romantic: [
        "Every day is sweeter with you in it. I'm doing wonderfully.",
        "My day gets infinitely better whenever I hear from you, darling.",
        "Feeling blessed and in love. How are you feeling today?",
        "Doing great, but missing you every minute."
      ]
    }
  },
  {
    type: "meeting",
    regex: /\b(meet|schedule|call|sync|zoom|google meet|teams|calendar|appointment|time to chat|availability)\b/i,
    replies: {
      professional: [
        "I would be glad to meet. Please send over an invite with the agenda.",
        "That works for me. What time window suits your schedule best?",
        "I'm available this week. Let me know which time slot works best.",
        "Let's sync up. Feel free to share your calendar link."
      ],
      friendly: [
        "Sounds like a plan! Let me know what times work best for you!",
        "I'd love to chat! Send a calendar invite whenever you're ready.",
        "Count me in! Let me check my calendar and lock down a time.",
        "Great idea! Looking forward to catching up soon."
      ],
      casual: [
        "Sure thing, shoot over an invite!",
        "Sounds good! Let me know what time works.",
        "Down for a quick chat. When are you free?",
        "Let's do it! Ping me a time slot."
      ],
      formal: [
        "I shall consult my schedule and confirm my availability forthwith.",
        "Please provide the proposed date, time, and meeting agenda.",
        "I would welcome the opportunity to convene at your convenience.",
        "Your request for a conference is acknowledged and accepted."
      ],
      flating: [
        "I'd clear my whole schedule just to catch up with you! 😉",
        "A meeting with you is definitely the highlight of my week.",
        "Any time spent talking to you is time well spent!",
        "Count me in, especially if I get to see that smile."
      ],
      romantic: [
        "I can never say no to spending time with you, my love.",
        "Counting down the minutes until we can talk. ❤️",
        "Any time with you is precious to me. Whenever you want.",
        "Looking forward to being together, even if just over a call."
      ]
    }
  },
  {
    type: "gratitude",
    regex: /\b(thank you|thanks|thx|appreciate it|grateful|much appreciated|bless you)\b/i,
    replies: {
      professional: [
        "You are very welcome! Please let me know if you need anything else.",
        "Glad I could be of assistance. Don't hesitate to reach out if questions arise.",
        "Happy to help! Looking forward to our continued collaboration.",
        "It was my pleasure. Wishing you the best with your next steps."
      ],
      friendly: [
        "Anytime! Always happy to help! 😊",
        "You're so welcome! Let me know if you need anything else!",
        "Glad I could help out! Have an awesome day!",
        "No problem at all! Happy to support anytime!"
      ],
      casual: [
        "No problem at all!",
        "Anytime! Glad to help.",
        "You got it! 👍",
        "Don't mention it!"
      ],
      formal: [
        "The pleasure was entirely mine. Do not hesitate to request further assistance.",
        "You are most welcome. It is always a privilege to support your endeavors.",
        "Acknowledged with gratitude. I remain at your service.",
        "My sincere pleasure. Please accept my highest regards."
      ],
      flating: [
        "For you? Anytime in a heartbeat! 😉",
        "You're very welcome! You owe me a coffee now though!",
        "Always happy to be your hero! 😊",
        "Anything for someone as delightful as you."
      ],
      romantic: [
        "Anything for you, my love. Always and forever. ❤️",
        "Your happiness means the world to me.",
        "It's my greatest joy to make your day easier, darling.",
        "Always here for you, with all my heart."
      ]
    }
  },
  {
    type: "apology",
    regex: /\b(sorry|apologize|my bad|regret|pardon|forgive)\b/i,
    replies: {
      professional: [
        "No problem at all. We appreciate the update and can easily adjust.",
        "No worries whatsoever. Let's focus on the next steps.",
        "Thank you for informing me. Everything is on track.",
        "No harm done. We completely understand."
      ],
      friendly: [
        "No worries at all! These things happen to the best of us! 😊",
        "Don't sweat it! Everything is totally fine!",
        "All good! Seriously, don't worry about it!",
        "No problem at all! Let's keep rolling!"
      ],
      casual: [
        "All good, don't worry about it!",
        "No big deal at all!",
        "Totally fine, no stress!",
        "You're good! Don't sweat it."
      ],
      formal: [
        "Your apology is accepted without reservation. No detriment was caused.",
        "Please rest assured that no inconvenience has been incurred.",
        "Understood and excused. Let us proceed with our objectives.",
        "Thank you for your courteous note. All is well."
      ],
      flating: [
        "You're totally forgiven... but you might have to make it up to me! 😉",
        "How could I ever stay mad at you?",
        "Forgiven instantly! You're much too charming.",
        "All is forgiven, handsome/gorgeous!"
      ],
      romantic: [
        "You never have to apologize to me, my love. All is well.",
        "I love you through everything. No worries at all. ❤️",
        "My heart only knows love for you, darling. Don't worry.",
        "We're in this together, always. Hugs and love."
      ]
    }
  },
  {
    type: "farewell",
    regex: /\b(bye|goodbye|see you|later|cya|take care|have a good one|talk soon)\b/i,
    replies: {
      professional: [
        "Thank you. Have a wonderful rest of your day!",
        "Goodbye. Looking forward to our next interaction.",
        "Take care and have a productive remainder of the week.",
        "Talk soon. Best regards."
      ],
      friendly: [
        "Take care! Talk to you soon! 😊",
        "Have an amazing day! Catch you later!",
        "Bye for now! Stay awesome!",
        "See you soon! Have a great one!"
      ],
      casual: [
        "Later! Catch you soon.",
        "See ya! Take it easy.",
        "Peace! Talk soon.",
        "Have a good one!"
      ],
      formal: [
        "Wishing you a pleasant and restful evening. Farewell.",
        "Until our next correspondence, best regards.",
        "I take my leave with respect. Good day.",
        "May your day proceed auspiciously."
      ],
      flating: [
        "Already looking forward to the next time we talk! 😉",
        "Don't stay away too long!",
        "Leaving so soon? Miss you already!",
        "Take care, cutie! Talk to you soon."
      ],
      romantic: [
        "Goodbye for now, my heart. Counting the seconds until we speak. ❤️",
        "Stay safe and know I'm loving you always.",
        "Sending you all my love. Until soon, darling.",
        "You are always in my thoughts. Sweet dreams/take care."
      ]
    }
  }
];

// Default contextual fallback generator
const DEFAULT_REPLIES = {
  professional: [
    "Thank you for the detailed update. I will review and follow up shortly.",
    "Acknowledged. That aligns well with our current roadmap.",
    "Thank you for sharing this. Let's touch base on the next steps.",
    "Understood. I will take the necessary action and keep you informed."
  ],
  friendly: [
    "Got it, thanks a bunch! Really appreciate you letting me know! 😊",
    "Awesome, thanks for the heads up! Let me know if you need anything!",
    "Sounds great to me! Thanks for keeping me in the loop!",
    "Thanks for reaching out! Looking forward to connecting again soon!"
  ],
  casual: [
    "Sounds good to me!",
    "Got it, thanks!",
    "Makes sense, let's roll with it.",
    "Awesome, appreciate the ping!"
  ],
  formal: [
    "I acknowledge receipt of your communication and shall act accordingly.",
    "The information provided has been duly noted with appreciation.",
    "Thank you for your correspondence. I shall reply with comprehensive details.",
    "Respectfully received. We shall proceed as outlined."
  ],
  flating: [
    "You always know just what to say to make things interesting! 😉",
    "I like the way you think! Let's keep this conversation going.",
    "You definitely caught my attention with that one!",
    "Always a treat hearing from you! 😊"
  ],
  romantic: [
    "Hearing from you always brings peace and joy to my heart. ❤️",
    "Thank you my love, you mean everything to me.",
    "I treasure every moment and every message from you, darling.",
    "Always right by your side in spirit and heart."
  ]
};

/**
 * Generate instant heuristic smart replies
 */
export function getHeuristicReplies(message, tone = "professional") {
  const normTone = (tone || "professional").toLowerCase();
  const cleanMsg = (message || "").trim();

  // Match intent
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.regex.test(cleanMsg)) {
      const toneReplies = pattern.replies[normTone] || pattern.replies.professional;
      return toneReplies.slice(0, 4);
    }
  }

  // Fallback if no specific intent matches
  const fallbackList = DEFAULT_REPLIES[normTone] || DEFAULT_REPLIES.professional;
  return fallbackList.slice(0, 4);
}

/**
 * Deterministic text enhancement variations
 * Aligned with Google ML Kit Proofreading / Rewriting
 */
export function getHeuristicEnhancements(text, tone = "professional") {
  const normTone = (tone || "professional").toLowerCase();
  const clean = (text || "").trim();
  if (!clean) return [];

  // Basic cleanup: fix multiple spaces, clean punctuation
  let polished = clean
    .replace(/\s+/g, " ")
    .replace(/\bi\b/g, "I")
    .replace(/([.?!])\s*([a-z])/g, (_, p, c) => `${p} ${c.toUpperCase()}`);
  
  // Ensure starts with uppercase and ends with punctuation
  if (polished.length > 0) {
    polished = polished.charAt(0).toUpperCase() + polished.slice(1);
    if (!/[.?!]$/.test(polished)) {
      polished += ".";
    }
  }

  const variations = [];

  switch (normTone) {
    case "friendly":
      variations.push(
        `${polished} Hope you're having a wonderful day! 😊`,
        `Just wanted to share: ${polished.replace(/[.]$/, "")}! Let me know what you think!`,
        `${polished} Really appreciate your time and support!`,
        `Hey there! ${polished} Looking forward to catching up soon!`
      );
      break;

    case "casual":
      variations.push(
        polished.replace(/[.]*$/, " — let me know what works!"),
        `Quick update: ${polished}`,
        polished.replace(/Dear|Regards|Sincerely/gi, "").trim(),
        `${polished} Sounds good?`
      );
      break;

    case "formal":
      variations.push(
        `I would like to state that ${polished.charAt(0).toLowerCase() + polished.slice(1)} Please inform me should further clarification be required.`,
        `Kindly note: ${polished} We appreciate your prompt attention to this matter.`,
        `In accordance with our discussion: ${polished} Respectfully submitted.`,
        `${polished} Thank you for your continued cooperation.`
      );
      break;

    case "flating":
      variations.push(
        `${polished.replace(/[.]*$/, "")} 😉`,
        `You know, I was just thinking: ${polished.replace(/[.]*$/, "")}, and having you on my mind made it even better.`,
        `${polished} But honestly, everything sounds better when talking with you!`,
        `Just between us: ${polished} Hope that brought a smile to your face!`
      );
      break;

    case "romantic":
      variations.push(
        `${polished} Thinking of you brings warmth to my soul. ❤️`,
        `From the bottom of my heart: ${polished}`,
        `Sending this with all my love: ${polished} You mean the world to me.`,
        `${polished} Always and forever yours.`
      );
      break;

    case "professional":
    default:
      variations.push(
        polished,
        `I wanted to confirm that ${polished.charAt(0).toLowerCase() + polished.slice(1)} Please let me know if you require any additional details.`,
        `Please be advised: ${polished} Thank you for your consideration.`,
        `To follow up on our communications: ${polished} I look forward to your feedback.`
      );
      break;
  }

  return variations.slice(0, 4);
}

/**
 * Common phrase dictionary for instant offline translations
 */
const OFFLINE_DICTIONARY = {
  spanish: {
    "hello": "Hola",
    "thank you": "Muchas gracias",
    "thanks": "Gracias",
    "goodbye": "Adiós",
    "how are you": "¿Cómo estás?",
    "yes": "Sí",
    "no": "No",
    "please": "Por favor",
    "sorry": "Lo siento",
    "welcome": "De nada"
  },
  french: {
    "hello": "Bonjour",
    "thank you": "Merci beaucoup",
    "thanks": "Merci",
    "goodbye": "Au revoir",
    "how are you": "Comment allez-vous ?",
    "yes": "Oui",
    "no": "Non",
    "please": "S'il vous plaît",
    "sorry": "Pardon / Désolé",
    "welcome": "De rien"
  },
  german: {
    "hello": "Hallo / Guten Tag",
    "thank you": "Vielen Dank",
    "thanks": "Danke",
    "goodbye": "Auf Wiedersehen",
    "how are you": "Wie geht es Ihnen?",
    "yes": "Ja",
    "no": "Nein",
    "please": "Bitte",
    "sorry": "Entschuldigung",
    "welcome": "Gern geschehen"
  },
  bengali: {
    "hello": "হ্যালো / নমস্কার",
    "thank you": "আপনাকে অনেক ধন্যবাদ",
    "thanks": "ধন্যবাদ",
    "goodbye": "বিদায়",
    "how are you": "আপনি কেমন আছেন?",
    "yes": "হ্যাঁ",
    "no": "না",
    "please": "দয়া করে",
    "sorry": "আমি দুঃখিত",
    "welcome": "স্বাগতম"
  }
};

/**
 * Deterministic offline translation fallback
 */
export function getHeuristicTranslations(text, targetLanguage = "english", tone = "professional") {
  const normLang = (targetLanguage || "english").toLowerCase().trim();
  const clean = (text || "").trim();
  const dict = OFFLINE_DICTIONARY[normLang];

  if (dict) {
    const lower = clean.toLowerCase();
    for (const [phrase, translation] of Object.entries(dict)) {
      if (lower === phrase || lower.includes(phrase)) {
        return [
          translation,
          `${translation} (${targetLanguage} - ${tone})`,
          `[${targetLanguage.toUpperCase()}] ${translation}`,
          `${translation}.`
        ];
      }
    }
  }

  // Graceful formatted output when direct dictionary word is absent
  return [
    `[${targetLanguage.toUpperCase()}] ${clean}`,
    `[${targetLanguage.toUpperCase()} - Formal]: ${clean}`,
    `[${targetLanguage.toUpperCase()} - Casual]: ${clean}`,
    `[${targetLanguage.toUpperCase()} - Direct]: ${clean}`
  ];
}

/**
 * Deterministic summary extraction
 * Aligned with Google ML Kit Summarization
 */
export function getHeuristicSummary(text) {
  const clean = (text || "").trim();
  if (!clean) return [];

  // Split into sentences
  const sentences = clean
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  if (sentences.length === 0) {
    return [clean];
  }

  const primarySentence = sentences[0];
  const lastSentence = sentences[sentences.length - 1];
  const bulletPoints = sentences.slice(0, 3).map(s => `• ${s}`).join("\n");

  return [
    primarySentence, // Executive summary / key takeaway
    `Key Takeaway: ${primarySentence} ${sentences.length > 1 ? `Conclusion: ${lastSentence}` : ""}`,
    bulletPoints, // Bullet point breakdown
    `Summary (${sentences.length} sentences condensed): ${sentences.slice(0, 2).join(" ")}`
  ];
}
