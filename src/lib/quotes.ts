export interface Quote {
  text: string;
  author: string;
}

const LOCAL_QUOTES: Quote[] = [
  { text: "Have the courage to build in public. True craftsmanship is showing the work, the bugs, and the updates.", author: "Software Artisan" },
  { text: "Software design is not just about making things look clean, it is about making things feel extremely alive.", author: "Product Architect" },
  { text: "Great tools are not built in a day. They are refined, contribution by contribution, review by review.", author: "Open Source Collective" },
  { text: "Every bug report is a gift of attention. Do not hide from feedback; celebrate the testers who push your limits.", author: "Public Maker" },
  { text: "Code should be written to be read by humans, and only incidentally for computers to execute.", author: "Harold Abelson" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Quality is not an act, it is a habit of craftsmanship.", author: "Aristotle" },
  { text: "The best way to predict the future of your product is to build it in public with your users.", author: "Indie Hacker" }
];

export async function getRandomQuote(): Promise<Quote> {
  // Safe quote picker (non-blocking)
  try {
    // Optionally fetch from a free quote API in the future (e.g. ZenQuotes or dummyJSON)
    // For now, we instantly pull from our beautifully curated local list to avoid blocking page rendering.
    const randomIndex = Math.floor(Math.random() * LOCAL_QUOTES.length);
    return LOCAL_QUOTES[randomIndex];
  } catch (error) {
    return LOCAL_QUOTES[0];
  }
}
