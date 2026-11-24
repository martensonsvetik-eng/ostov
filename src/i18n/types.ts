export type Lang = 'ru' | 'en';

type R<K extends string, V = string> = Record<K, V>;
type Idx4 = '0' | '1' | '2' | '3';
type Idx3 = '0' | '1' | '2';
type Idx5 = '0' | '1' | '2' | '3' | '4';
type MaterialKey = 'oak' | 'walnut' | 'travertine' | 'marble' | 'brass';
type WhoKey = 'owner' | 'pro';
type Choice<K extends string> = { label: string; options: R<K> };

/** Lists are objects with stable keys so every leaf is a string. */
export interface Dict {
  meta: { title: string; description: string };
  header: {
    skip: string;
    logo: string;
    navLabel: string;
    nav: R<'collections' | 'projects' | 'process' | 'pro' | 'showroom'>;
    cta: string;
    ctaShort: string;
    menuOpen: string;
    menuClose: string;
    langLabel: string;
    langRu: string;
    langEn: string;
  };
  hero: { title: string; subtitle: string; cta: string; secondary: string; imageAlt: string };
  facts: { label: string; items: R<Idx4, { title: string; text: string }> };
  collections: {
    title: string;
    items: R<
      'geometry' | 'modern' | 'neoclassic',
      { name: string; text: string; description: string; coverAlt: string; detailAlts: R<'0' | '1'> }
    >;
    more: string;
    less: string;
    catalogLink: string;
  };
  materials: {
    title: string;
    lead: string;
    scenes: R<'oak' | 'travertine' | 'brass' | 'hardware', { name: string; text: string; alt: string }>;
    samplesLink: string;
  };
  projects: {
    title: string;
    main: {
      name: string;
      meta: string;
      text: string;
      quote: string;
      planLabel: string;
      planAlt: string;
    };
    cards: R<Idx3, { name: string; meta: string }>;
  };
  process: { title: string; stepsLabel: string; steps: R<Idx4, { title: string; duration: string }> };
  faq: { title: string; items: R<Idx5, { q: string; a: string }> };
  contact: {
    title: string;
    priceLabel: string;
    price: string;
    priceDetails: string;
    personName: string;
    personRole: string;
    personText: string;
    personAlt: string;
    showroomLabel: string;
    showroomAddress: string;
    showroomHours: string;
  };
  forms: {
    demoNote: string;
    loading: string;
    close: string;
    back: string;
    next: string;
    again: string;
    errorSummary: string;
    serverError: string;
    success: { title: string; text: string };
    errors: R<'required' | 'tooShort' | 'tooLong' | 'phoneDigits' | 'phoneChars' | 'email' | 'consent' | 'choice'>;
    materials: R<MaterialKey>;
    contact: {
      title: string;
      name: string;
      phone: string;
      method: Choice<'call' | 'message'>;
      meeting: Choice<'showroom' | 'onsite' | 'video'>;
      who: { label: string; options: R<WhoKey> };
      consent: string;
      newsletter: string;
      submit: string;
      prepare: string;
    };
    questionnaire: {
      title: string;
      stepOf: string;
      steps: R<'object' | 'style' | 'materials' | 'budget' | 'contacts', string>;
      object: Choice<'flat' | 'house' | 'other'>;
      style: { label: string };
      materials: { label: string; hint: string };
      budget: Choice<'upTo3' | 'from3to6' | 'over6' | 'unknown'>;
      term: Choice<'upTo6' | 'from6to12' | 'overYear'>;
      priceReminder: string;
      planNote: string;
      submit: string;
    };
    catalog: { title: string; email: string; consent: string; submit: string; success: string };
    samples: {
      title: string;
      materials: string;
      name: string;
      phone: string;
      who: string;
      city: string;
      studio: string;
      note: string;
      consent: string;
      submit: string;
    };
  };
  pro: {
    title: string;
    items: R<Idx4>;
    cta: string;
    samplesLink: string;
    catalogLink: string;
  };
  footer: {
    company: string;
    address: string;
    phone: string;
    email: string;
    messenger: string;
    prepare: string;
    policy: string;
    policyText: string;
    concept: string;
  };
}
