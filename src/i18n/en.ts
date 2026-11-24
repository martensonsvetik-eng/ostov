import type { Dict } from './types';

export const en: Dict = {
  meta: {
    title: 'OSTOV — kitchens in solid wood and stone',
    description:
      'Our own workshop near Kaluga. Solid wood, stone, metal. 12 years, 240 projects. A concept project for a portfolio: the brand is fictional.',
  },
  header: {
    skip: 'Skip to content',
    logo: 'OSTOV',
    navLabel: 'Main navigation',
    nav: {
      collections: 'Collections',
      projects: 'Projects',
      process: 'How we work',
      pro: 'For architects',
      showroom: 'Showroom',
    },
    cta: 'Discuss your project',
    ctaShort: 'Discuss',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    langLabel: 'Page language',
    langRu: 'RU',
    langEn: 'EN',
  },
  hero: {
    title: 'The kitchen is the frame of the home',
    subtitle: 'Our own workshop near Kaluga. Solid wood, stone, metal. 12 years, 240 projects.',
    cta: 'Discuss your project',
    secondary: 'See projects',
    imageAlt: 'A light kitchen with a white island and a large window onto the garden, in warm afternoon sun',
  },
  facts: {
    label: 'The workshop at a glance',
    items: {
      '0': { title: 'Our own production', text: 'joinery and stone workshops under one roof' },
      '1': { title: '10 years', text: 'warranty on the cabinet, 5 years on hardware' },
      '2': { title: '10–14 weeks', text: 'to build, once the design is approved' },
      '3': { title: 'One architect', text: 'leads the project from sketch to installation' },
    },
  },
  collections: {
    title: 'Three characters from one workshop',
    items: {
      geometry: {
        name: 'Quiet Geometry',
        text: 'Strict planes, concealed handles, oak and graphite.',
      },
      modern: { name: 'Warm Modern', text: 'Soft radii, walnut veneer, brass.' },
      neoclassic: {
        name: 'Neoclassic',
        text: 'Panelled fronts, hand-painted finish, marble.',
      },
    },
    more: 'Details',
    less: 'Collapse',
    catalogLink: 'Request the collections catalogue (PDF)',
  },
  materials: {
    title: 'Wood and stone from one workshop',
    lead: 'We cut the stone and plane the wood ourselves, so the island and the worktop are one piece, with no gaps and no fitting on site.',
    scenes: {
      oak: { name: 'Oak', text: 'solid wood, oil and wax finish.' },
      travertine: { name: 'Travertine', text: 'open pores, hand-sanded.' },
      brass: { name: 'Brass', text: 'left unlacquered, it develops a patina over time.' },
      hardware: {
        name: 'Hardware',
        text: 'mechanisms from premium European makers, with soft closing.',
      },
    },
    samplesLink: 'Order samples',
  },
  projects: {
    title: 'Projects at different budgets',
    main: {
      name: 'House Among the Pines',
      meta: 'Moscow region · 5.8 million ₽ · 16 weeks',
      text: 'The client came with their own architect and a finished house plan. We suggested making the island and the worktop as one piece: oak and travertine with no visible joint.',
      quote:
        'The most valuable thing was that one person was responsible for everything, from the sketch to connecting the appliances.',
      planLabel: 'Floor plan',
      planAlt: 'Kitchen floor plan diagram for the House Among the Pines project',
    },
    cards: {
      '0': { name: 'Apartment on Patriarshy', meta: 'Moscow · 3.2 million ₽ · 13 weeks' },
      '1': {
        name: 'Kitchen-living room in Jūrmala',
        meta: 'Latvia · €78,000 · 18 weeks · project run by video call',
      },
      '2': {
        name: 'Loft on Vasilievsky',
        meta: 'Saint Petersburg · 2.7 million ₽ · 12 weeks · with a guest designer',
      },
    },
  },
  process: {
    title: 'From sketch to the first dinner',
    stepsLabel: 'Stages of work',
    steps: {
      '0': { title: 'Meeting and brief', duration: '1 day' },
      '1': { title: 'Sketch and estimate', duration: '3–4 weeks' },
      '2': { title: 'Production', duration: '10–14 weeks' },
      '3': { title: 'Installation and connection', duration: '5–7 days' },
    },
  },
  faq: {
    title: 'Frequently asked questions',
    items: {
      '0': {
        q: 'Are you a manufacturer or a showroom?',
        a: 'A manufacturer. The workshop is near Kaluga, the showroom is in Moscow.',
      },
      '1': {
        q: 'What is included in the price?',
        a: 'Design, production, delivery and installation. Appliances are priced separately.',
      },
      '2': {
        q: 'Do you work outside the city and in other countries?',
        a: 'Yes. We visit sites in the Moscow region; other projects run by video call, with a visit for installation.',
      },
      '3': {
        q: 'Can I work with my own designer and site manager?',
        a: 'Yes. The OSTOV architect agrees the drawings with your team.',
      },
      '4': {
        q: 'What is the warranty?',
        a: '10 years on the cabinet, 5 years on hardware, with a service visit within 5 working days.',
      },
    },
  },
  contact: {
    title: 'Let us discuss your project',
    priceLabel: 'Price',
    price: 'Projects from €26 000, typically €42 000–63 000.',
    priceDetails:
      'Compact kitchen — from €26 000 · kitchen with an island — €42 000–63 000 · kitchen-living room with a pantry — from €73 000.',
    personName: 'Vera Lanskaya',
    personRole: 'lead architect',
    personText: '15 years in interiors. Leads your project from sketch to installation.',
    personAlt: 'Portrait of Vera Lanskaya, lead architect',
    showroomLabel: 'Showroom',
    showroomAddress: 'Moscow, Vymyshlennaya st., 1',
    showroomHours: 'Mon–Sat 11:00–20:00, by appointment',
  },
  forms: {
    demoNote: 'Demo form: no data is sent',
    loading: 'Sending…',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    again: 'Fill in again',
    errorSummary: 'Please check the form: some fields have errors',
    serverError: 'Could not send. Your data is saved in the form, please try again',
    success: {
      title: 'Thank you, {name}',
      text: 'This is a demonstration: no data was sent. In a real project, Vera Lanskaya would contact you within a working day.',
    },
    errors: {
      required: 'Fill in this field',
      tooShort: 'Too short: at least 2 characters',
      tooLong: 'Too long: no more than 60 characters',
      phoneDigits: 'Enter a phone number: at least 10 digits',
      phoneChars: 'A phone number may contain digits, spaces, brackets, hyphens and «+»',
      email: 'Enter an e-mail in the format name@example.com',
      consent: 'Consent to data processing is required',
      choice: 'Choose an option',
    },
    materials: {
      oak: 'Oak',
      walnut: 'Walnut',
      travertine: 'Travertine',
      marble: 'Marble',
      brass: 'Brass',
    },
    contact: {
      title: 'Book a discussion',
      name: 'How should we address you',
      phone: 'Phone',
      method: {
        label: 'Preferred way to reach you',
        options: { call: 'Call', message: 'Message in a messenger' },
      },
      meeting: {
        label: 'Meeting format',
        options: { showroom: 'Showroom in Moscow', onsite: 'Visit to your site', video: 'Video call' },
      },
      who: {
        label: 'Who you are',
        options: { owner: 'Homeowner', pro: 'Architect / designer' },
      },
      consent: 'I agree to the processing of my data',
      newsletter: 'I agree to receive the newsletter',
      submit: 'Book a discussion',
      prepare: 'Prepare the project in advance',
    },
    questionnaire: {
      title: 'Prepare the project in advance',
      stepOf: 'Step {current} of {total}',
      steps: {
        object: 'Type of property',
        style: 'Style',
        materials: 'Materials',
        budget: 'Budget and timing',
        contacts: 'Contacts',
      },
      object: {
        label: 'Type of property',
        options: { flat: 'Apartment', house: 'House', other: 'Other' },
      },
      style: { label: 'Choose one of the three collections' },
      materials: { label: 'Materials', hint: 'You can choose several' },
      budget: {
        label: 'Budget',
        options: {
          upTo3: 'Up to 3 million ₽',
          from3to6: '3–6 million ₽',
          over6: 'More than 6 million ₽',
          unknown: 'Not sure yet',
        },
      },
      term: {
        label: 'Timing',
        options: {
          upTo6: 'Up to 6 months',
          from6to12: '6–12 months',
          overYear: 'More than a year',
        },
      },
      priceReminder: 'Projects from €26 000, typically €42 000–63 000.',
      planNote: 'In a real project, you could attach a plan here.',
      submit: 'Send the questionnaire',
    },
    catalog: {
      title: 'Request the catalogue',
      email: 'E-mail',
      consent: 'I agree to the processing of my data',
      submit: 'Request the catalogue',
      success: 'Demonstration: the catalogue was not sent',
    },
    samples: {
      title: 'Order samples',
      materials: 'Materials',
      name: 'How should we address you',
      phone: 'Phone',
      who: 'Who you are',
      city: 'Delivery city',
      studio: 'Studio name',
      note: 'We deliver samples within 5 working days',
      consent: 'I agree to the processing of my data',
      submit: 'Order samples',
    },
  },
  pro: {
    title: 'For architects and designers',
    items: {
      '0': '3D and DWG library',
      '1': 'A technologist replies within a working day',
      '2': 'Samples to your studio within 5 working days',
      '3': 'A partner fee that we disclose to the client',
    },
    cta: 'Get access to the library',
    samplesLink: 'Order samples for your studio',
    catalogLink: 'Request the catalogue',
  },
  footer: {
    company: 'Ostov LLC (fictional)',
    address: 'Moscow, Vymyshlennaya st., 1',
    phone: '+7 000 000-00-00',
    email: 'hello@ostov.example',
    messenger: 'Message us',
    prepare: 'Prepare the project in advance',
    policy: 'Data processing policy',
    policyText:
      'This is a placeholder. The site is a concept project for a portfolio: the forms neither send nor store data, so no data processing policy is needed.',
    concept:
      'Concept project for a portfolio. The brand, people and projects are fictional. The form does not send data',
  },
};
