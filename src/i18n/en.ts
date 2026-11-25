import type { Dict } from './types';

export const en: Dict = {
  meta: {
    title: 'OSTOV — kitchens in solid wood and stone',
    description:
      'Our own workshop near Kaluga. Solid wood, stone, metal. 12 years, 240 projects.',
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
    title: 'Kitchens made to individual designs',
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
        text: 'Strict planes, concealed handles, black-stained and light oak.',
        description:
          'Handleless fronts open with a push or through a shadow gap. Black-stained oak under oil, light oak tall units and a black stone worktop — everything in one plane, nothing protruding.',
        coverAlt: 'Quiet Geometry kitchen: handleless black-stained oak fronts beside a natural oak tall unit',
        detailAlts: {
          '0': 'Leather bar stools at the island and handleless black oak drawers',
          '1': 'Aisle between the island and black oak tall units, stone worktops',
        },
      },
      modern: {
        name: 'Warm Modern',
        text: 'Walnut veneer, pale stone, brass light.',
        description:
          'Walnut veneer with an open grain on the fronts, an island with a pale stone top. The brass pendant and pulls are left unlacquered and darken over time, as in old houses.',
        coverAlt: 'Warm Modern kitchen: walnut-veneer island and cabinets, a white worktop and a hammered brass pendant',
        detailAlts: {
          '0': 'A hammered brass pendant against walnut wall cabinets',
          '1': 'A walnut island with wooden stools by a garden window',
        },
      },
      neoclassic: {
        name: 'Neoclassic',
        text: 'Panelled fronts, hand-painted finish, marble.',
        description:
          'Panelled fronts are hand-painted in several coats; cornices and pilasters are made to your measurements. Worktop and splashback are cut from one marble slab with matched veining.',
        coverAlt: 'Neoclassic kitchen: light grey panelled fronts, an island with a marble top and a window with sheer curtains',
        detailAlts: {
          '0': 'Panelled fronts and a marble splashback under a pendant lamp',
          '1': 'Corner of the island with a marble top beside panelled fronts',
        },
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
      oak: {
        name: 'Oak',
        text: 'solid wood, oil and wax finish.',
        alt: 'Close-up of oiled oak grain',
      },
      travertine: {
        name: 'Travertine',
        text: 'open pores, hand-sanded.',
        alt: 'Close-up of a travertine edge with open pores',
      },
      brass: {
        name: 'Brass',
        text: 'left unlacquered: it darkens softly over time.',
        alt: 'Close-up of a brass knob on a light cabinet front',
      },
      hardware: {
        name: 'Hardware',
        text: 'pull-out systems and organisers with soft closing.',
        alt: 'A full-extension drawer with a dish organiser',
      },
    },
    samplesLink: 'Order samples',
  },
  projects: {
    title: 'Projects at different budgets',
    main: {
      name: 'House Among the Pines',
      meta: 'Moscow region · €60 000 · 16 weeks',
      text: 'The client came with their own architect and a finished house plan. We suggested making the island and the worktop as one piece: walnut and pale stone with no visible joint.',
      quote:
        'The most valuable thing was that one person was responsible for everything, from the sketch to connecting the appliances.',
      quoteCite: 'The client',
      planLabel: 'Floor plan',
      planAlt: 'Kitchen floor plan diagram for the House Among the Pines project',
      imageAlt: 'Kitchen in a country house: an island with a pale stone top, pines beyond the triangular windows',
      hotspotsLabel: 'Materials in the photo',
      hotspots: {
        island: { title: 'Island — pale stone', text: 'Top and side cut from one slab, with no visible joint.' },
        fronts: { title: 'Fronts — walnut veneer', text: 'Open grain, oil and wax finish, dark steel profile handles.' },
        stairs: { title: 'Staircase — solid oak', text: 'Treads made in the same workshop as the kitchen.' },
      },
    },
    cards: {
      '0': {
        name: 'Apartment on Patriarshy',
        meta: 'Moscow · €33 000 · 13 weeks',
        imageAlt: 'Compact kitchen: dark walnut-veneer units with built-in appliances and a terrazzo island',
      },
      '1': {
        name: 'Kitchen-living room in Jūrmala',
        meta: 'Latvia · €78 000 · 18 weeks · project run by video call',
        imageAlt: 'Bright kitchen-living room: a white fluted island, a wall of walnut units, a dining table and an armchair',
      },
      '2': {
        name: 'Loft on Vasilievsky',
        meta: 'Saint Petersburg · €28 000 · 12 weeks · with a guest designer',
        imageAlt: 'Loft kitchen: a concrete ceiling with track lights, a wood-clad island with a marble top and a long dining table',
      },
    },
    metaLabels: { place: 'Location', budget: 'Budget', duration: 'Timeline' },
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
    price: 'Projects from €26 000, typically €42 000–63 000.',
    priceDetails:
      'Compact kitchen — from €26 000 · kitchen with an island — €42 000–63 000 · kitchen-living room with a pantry — from €73 000.',
    personName: 'Vera Lanskaya',
    personRole: 'lead architect',
    personText: '15 years in interiors. Leads your project from sketch to installation.',
    personAlt: "An architect's hands drafting a plan at the desk",
    showroomLabel: 'Showroom',
    showroomAddress: 'Moscow, 4 Kamnereznyy proezd',
    showroomHours: 'Mon–Sat 11:00–20:00, by appointment',
  },
  forms: {
    noscript: 'To send a request, please enable JavaScript or give us a call.',
    loading: 'Sending…',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    again: 'Fill in again',
    errorSummary: 'Please check the form: some fields have errors',
    serverError: 'Could not send: please check your internet connection. Your data is saved in the form, please try again',
    success: {
      title: 'Thank you, {name}',
      text: 'Vera Lanskaya will contact you within a working day.',
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
          upTo3: 'Up to €31 000',
          from3to6: '€31 000–63 000',
          over6: 'More than €63 000',
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
      priceReminder: 'Projects from €26 000, typically €42 000–63 000.',
      planNote: 'You can share the floor plan with the architect after the first call.',
      submit: 'Send the questionnaire',
    },
    catalog: {
      title: 'Request the catalogue',
      email: 'E-mail',
      consent: 'I agree to the processing of my data',
      submit: 'Request the catalogue',
      success: 'Thank you for your interest in OSTOV',
      successText: 'We will send the catalogue within a working day.',
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
      successText: 'We will call you within a working day to arrange the delivery of the samples.',
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
    company: 'Kitchens in solid wood and stone. Our own workshop near Kaluga.',
    address: 'Moscow, 4 Kamnereznyy proezd',
    phone: '+7 (495) 000-00-00',
    email: 'hello@ostov.example',
    messenger: 'Message us',
    prepare: 'Prepare the project in advance',
    policy: 'Data processing policy',
    policyText:
      'Our forms ask for your name, phone number or e-mail, city and questionnaire answers. We use this data only to contact you about your project and do not pass it on to third parties. The questionnaire draft is kept in this browser tab until it is closed. To withdraw your consent to data processing, write to hello@ostov.example.',
    rights: '© 2026 Ostov LLC. All rights reserved.',
  },
  notFound: {
    title: 'Page not found',
    text: 'This page does not exist. The link may be out of date.',
    home: 'Back to the home page',
  },
};
