/* Synthetic Northgate Audio copy. Not a real brand. */
(function () {
  window.KETTLE_DATA = {
    brand: "Northgate Audio",
    campaign: "Halo 2 launch",
    editors: { production: "Priya (Production Editor)", legal: "Marcus (Client Legal)" },
    samplePrice: "$199 through Nov 30",
    sampleLegal: "Offer valid in US and Canada. While supplies last.",
    deck: [
      { id: "H1", label: "Headline", text: "Halo 2 is here", usedIn: ["Display banners", "Web home hero", "Email hero", "Social story"] },
      { id: "S1", label: "Subhead", text: "Studio sound, pocket size", usedIn: ["Web product page", "Email hero", "Social feed"] },
      { id: "P1", label: "Price", text: "$249", usedIn: ["All 24 placements in this campaign"] },
      { id: "L1", label: "Legal", text: "Offer valid in US and Canada.", legal: true, usedIn: ["Web legal footer", "Email footer"] },
      { id: "C1", label: "CTA", text: "Shop the launch", usedIn: ["Web product page", "Email hero", "Social feed"] },
      { id: "D1", label: "Launch date", text: "October 14, 2026", usedIn: ["Email subject", "Web home hero", "Social feed"] }
    ],
    placements: [
      { id: "BN-300x250-enUS", channel: "Display", size: "300x250", locale: "en-US", lineIds: ["H1", "P1"], limit: 90, component: "banners/300x250-enUS.html", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Now {{price}}.", image: true, altCurrent: "Photo of Halo 2 headphones. Price $249.", altDraft: "Photo of Halo 2 headphones. Launch price $199 through Nov 30." },
      { id: "BN-728x90-enUS", channel: "Display", size: "728x90", locale: "en-US", lineIds: ["H1", "P1"], limit: 70, component: "banners/728x90-enUS.html", oldText: "Halo 2. Now $249.", fit: "Halo 2. Now {{price}}.", image: true, altCurrent: "Wide banner of Halo 2 headphones at $249.", altDraft: "Wide banner of Halo 2 headphones at $199 through Nov 30." },
      { id: "BN-320x50-enUS", channel: "Display", size: "320x50", locale: "en-US", lineIds: ["H1", "P1"], limit: 28, component: "banners/320x50-enUS.html", oldText: "Halo 2. Now $249.", fit: "Halo 2. Now {{price}}", long: true, drafts: ["Halo 2. Now $199 thru 11/30", "Halo 2 for $199. Ends 11/30"], image: true, altCurrent: "Small banner. Halo 2 now $249.", altDraft: "Small banner. Halo 2 now $199 through Nov 30." },
      { id: "BN-160x600-enUS", channel: "Display", size: "160x600", locale: "en-US", lineIds: ["H1", "P1", "C1"], limit: 120, component: "banners/160x600-enUS.html", oldText: "Halo 2 is here. Now $249. Shop the launch.", fit: "Halo 2 is here. Now {{price}}. Shop the launch.", image: true, altCurrent: "Tall banner of Halo 2 headphones priced at $249.", altDraft: "Tall banner of Halo 2 headphones priced at $199 through Nov 30." },
      { id: "BN-300x250-enCA", channel: "Display", size: "300x250", locale: "en-CA", lineIds: ["H1", "P1"], limit: 90, component: "banners/300x250-enCA.html", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Now {{price}}." },
      { id: "BN-728x90-enCA", channel: "Display", size: "728x90", locale: "en-CA", lineIds: ["H1", "P1"], limit: 36, component: "banners/728x90-enCA.html", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Now {{price}}.", long: true, drafts: ["Halo 2. $199 through Nov 30", "Halo 2 now $199. Ends Nov 30"] },
      { id: "BN-320x50-enCA", channel: "Display", size: "320x50", locale: "en-CA", lineIds: ["H1", "P1"], limit: 28, component: "banners/320x50-enCA.html", oldText: "Halo 2. Now $249.", fit: "Halo 2. Now {{price}}", long: true, drafts: ["Halo 2. Now $199 thru 11/30", "Halo 2 for $199. Ends 11/30"] },
      { id: "BN-160x600-enCA", channel: "Display", size: "160x600", locale: "en-CA", lineIds: ["H1", "P1"], limit: 120, component: "banners/160x600-enCA.html", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Studio sound. Now {{price}}." },
      { id: "EM-subject-enUS", channel: "Email", size: "subject", locale: "en-US", lineIds: ["P1", "D1"], limit: 60, component: "email/subject-enUS.txt", oldText: "Halo 2 is $249", fit: "Halo 2 is {{price}}" },
      { id: "EM-preheader-enUS", channel: "Email", size: "preheader", locale: "en-US", lineIds: ["S1", "P1"], limit: 90, component: "email/preheader-enUS.txt", oldText: "Studio sound, pocket size. Now $249.", fit: "Studio sound, pocket size. Now {{price}}." },
      { id: "EM-hero-enUS", channel: "Email", size: "hero", locale: "en-US", lineIds: ["H1", "P1"], limit: 100, component: "email/hero-enUS.html", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Now {{price}}.", image: true, altCurrent: "Email hero image of Halo 2 at $249.", altDraft: "Email hero image of Halo 2 at $199 through Nov 30." },
      { id: "EM-subject-enCA", channel: "Email", size: "subject", locale: "en-CA", lineIds: ["P1"], limit: 60, component: "email/subject-enCA.txt", oldText: "Halo 2 is $249", fit: "Halo 2 is {{price}}" },
      { id: "EM-preheader-enCA", channel: "Email", size: "preheader", locale: "en-CA", lineIds: ["S1", "P1"], limit: 32, component: "email/preheader-enCA.txt", oldText: "Studio sound. Now $249.", fit: "Studio sound. Now {{price}}.", long: true, drafts: ["Now $199 through Nov 30", "Halo 2 $199 ends Nov 30"] },
      { id: "EM-subject-frCA", channel: "Email", size: "subject", locale: "fr-CA", lineIds: ["P1"], limit: 50, component: "email/subject-frCA.txt", oldText: "Halo 2 maintenant a 249 $", localeText: "Halo 2 a 199 $ jusqu'au 30 nov.", needsHumanLocale: true, drafts: ["Halo 2 a 199 $ jusqu'au 30 nov."] },
      { id: "WEB-home-enUS", channel: "Web", size: "home hero", locale: "en-US", lineIds: ["H1", "P1", "D1"], limit: 80, component: "components/HomeHero.tsx", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Now {{price}}.", image: true, altCurrent: "Home hero photo of Halo 2 headphones, $249.", altDraft: "Home hero photo of Halo 2 headphones, $199 through Nov 30." },
      { id: "WEB-product-enUS", channel: "Web", size: "product page", locale: "en-US", lineIds: ["H1", "S1", "P1", "C1"], limit: 140, component: "components/ProductHero.tsx", oldText: "Halo 2 is here. Studio sound, pocket size. Now $249. Shop the launch.", fit: "Halo 2 is here. Studio sound, pocket size. Now {{price}}. Shop the launch." },
      { id: "WEB-cart-enUS", channel: "Web", size: "cart banner", locale: "en-US", lineIds: ["P1"], limit: 26, component: "components/CartBanner.tsx", oldText: "Halo 2 now $249.", fit: "Halo 2 now {{price}}.", long: true, drafts: ["Halo 2 is $199 thru 11/30", "Halo 2 $199 ends 11/30"] },
      { id: "WEB-home-enCA", channel: "Web", size: "home hero", locale: "en-CA", lineIds: ["H1", "P1"], limit: 80, component: "components/HomeHero.enCA.tsx", oldText: "Halo 2 is here. Now $249.", fit: "Halo 2 is here. Now {{price}}." },
      { id: "WEB-legal-enUS", channel: "Web", size: "legal footer", locale: "en-US", lineIds: ["L1"], limit: 120, component: "components/LegalFooter.tsx", oldText: "Offer valid in US and Canada.", legal: true },
      { id: "EM-footer-legal", channel: "Email", size: "legal footer", locale: "en-US", lineIds: ["L1"], limit: 140, component: "email/footer-legal.html", oldText: "Offer valid in US and Canada.", legal: true },
      { id: "SOC-story-enUS", channel: "Social", size: "story frame", locale: "en-US", lineIds: ["H1", "P1"], limit: 80, component: "social/story-enUS.txt", oldText: "Halo 2. Now $249.", fit: "Halo 2. Now {{price}}." },
      { id: "SOC-feed-enUS", channel: "Social", size: "feed caption", locale: "en-US", lineIds: ["H1", "S1", "P1", "C1"], limit: 180, component: "social/feed-enUS.txt", oldText: "Halo 2 is here. Studio sound, pocket size. Launch price $249. Shop the launch.", fit: "Halo 2 is here. Studio sound, pocket size. Launch price {{price}}. Shop the launch." },
      { id: "WEB-home-frCA", channel: "Web", size: "home hero", locale: "fr-CA", lineIds: ["H1", "P1"], limit: 80, component: "components/HomeHero.frCA.tsx", oldText: "Halo 2 est la. 249 $.", localeText: "Halo 2 est la. 199 $ jusqu'au 30 nov.", needsHumanLocale: true, drafts: ["Halo 2 est la. 199 $ jusqu'au 30 nov."] },
      { id: "SOC-feed-enCA", channel: "Social", size: "feed caption", locale: "en-CA", lineIds: ["H1", "S1", "P1"], limit: 180, component: "social/feed-enCA.txt", oldText: "Halo 2 is here. Studio sound, pocket size. Now $249.", fit: "Halo 2 is here. Studio sound, pocket size. Now {{price}}." }
    ]
  };
})();
