// ─── TypeScript interfaces for rich subcategory metadata ─────────────────────

export interface SubcategoryData {
  slug: string
  title: string
  url: string
  h1: string
  description: string
  mainKeyword: string
  keywordsCount: number
  monthlyVolume: number
  priority: 1 | 2 | 3
  stage: 1 | 2 | 3
  articlesGoal: number
  isUsp?: boolean
  hasCalculator?: boolean
  isReady: boolean
  relatedSubcategories: string[]
}

export interface SiloWithData {
  label: string
  emoji: string
  description: string
  color: string
  pillarH1?: string
  pillarTitle?: string
  pillarDescription?: string
  priority?: number
  keywordsTotal?: number
  monthlySearchVolume?: number
  isReady?: boolean
  subcategories: Record<string, string>
  subcategoriesData?: SubcategoryData[]
}

// SILO architecture config for the blog

export const SILO_CONFIG = {
  pohudenie: {
    label: 'Похудение',
    emoji: '⚖️',
    description: 'Как похудеть без диет и голоданий. Причины лишнего веса, ускорение метаболизма, правильный подход к снижению веса после 40.',
    color: '#E8F5FF',
    pillarH1: 'Как похудеть женщине правильно и без вреда здоровью',
    pillarTitle: 'Как похудеть женщине без вреда здоровью: полный гид нутрициолога | Вкус Жизни',
    pillarDescription: 'Экспертное руководство нутрициолога Натальи Томшиной: как безопасно похудеть женщине без диет, голоданий и подсчёта калорий. Методика для возраста 35-60 лет.',
    priority: 1,
    keywordsTotal: 925,
    monthlySearchVolume: 1576946,
    isReady: false,
    subcategories: {
      'posle-40':               'После 40 лет',
      'posle-50':               'После 50 лет',
      'posle-60':               'После 55-60 лет',
      'pri-klimakse':           'При климаксе и менопаузе',
      'pri-gormonalnyh-sboyah': 'При гормональных сбоях',
      'bez-diet-bez-sporta': 'Без диет и без спорта',
      'za-skolko':              'За сколько можно похудеть',
      'bystro':                 'Как быстро похудеть',
      'na-skolko-kg':           'Похудеть на X кг',
      'chto-est':               'Что есть при похудении',
      'kbzhu':                  'КБЖУ и калории',
      'prichiny':               'Лишний вес: причины',
      'ne-poluchaetsya':        'Не могу похудеть',
      'zhivot-boka':            'Живот, бока и проблемные зоны',
      'doma':                   'В домашних условиях',
      'zhirosjiganie':          'Жиросжигание',
      'kak-nachat':             'С чего начать похудение',
      'analizy':                'Анализы перед похудением',
      'otzyvy':                 'Реальные отзывы и истории',
    },
    subcategoriesData: [
      {
        slug: 'posle-40', title: 'После 40 лет',
        url: '/blog/pohudenie/posle-40/',
        h1: 'Как похудеть женщине после 40 лет без вреда здоровью',
        description: 'Похудение для женщин 35-45 лет: особенности метаболизма, гормональные изменения и работающие методы.',
        mainKeyword: 'как похудеть после 40 лет',
        keywordsCount: 53, monthlyVolume: 37318, priority: 1, stage: 1, articlesGoal: 20,
        isReady: false,
        relatedSubcategories: ['posle-50', 'pri-klimakse', 'bez-diet-bez-sporta', 'kak-nachat'],
      },
      {
        slug: 'posle-50', title: 'После 50 лет',
        url: '/blog/pohudenie/posle-50/',
        h1: 'Как похудеть после 50 лет женщине',
        description: 'Похудение в 50+: работа с замедленным метаболизмом, климаксом и гормональными изменениями.',
        mainKeyword: 'похудение для женщин после 50',
        keywordsCount: 45, monthlyVolume: 64096, priority: 1, stage: 1, articlesGoal: 18,
        isReady: false,
        relatedSubcategories: ['posle-40', 'posle-60', 'pri-klimakse', 'pri-gormonalnyh-sboyah'],
      },
      {
        slug: 'posle-60', title: 'После 55-60 лет',
        url: '/blog/pohudenie/posle-60/',
        h1: 'Как похудеть женщине после 60 лет',
        description: 'Мягкое похудение для женщин старше 55: безопасные методы с учётом здоровья и образа жизни.',
        mainKeyword: 'как похудеть после 60',
        keywordsCount: 22, monthlyVolume: 8712, priority: 3, stage: 3, articlesGoal: 8,
        isReady: false,
        relatedSubcategories: ['posle-50', 'pri-klimakse', 'doma', 'analizy'],
      },
      {
        slug: 'pri-klimakse', title: 'При климаксе и менопаузе',
        url: '/blog/pohudenie/pri-klimakse/',
        h1: 'Как похудеть при климаксе и в менопаузе',
        description: 'Похудение в период климакса: почему набирается вес и какие методы работают при гормональной перестройке.',
        mainKeyword: 'как похудеть при климаксе',
        keywordsCount: 14, monthlyVolume: 6909, priority: 2, stage: 2, articlesGoal: 10,
        isReady: false,
        relatedSubcategories: ['posle-40', 'posle-50', 'pri-gormonalnyh-sboyah', 'prichiny'],
      },
      {
        slug: 'pri-gormonalnyh-sboyah', title: 'При гормональных сбоях',
        url: '/blog/pohudenie/pri-gormonalnyh-sboyah/',
        h1: 'Как похудеть при гормональном сбое',
        description: 'Похудение при инсулинорезистентности, гипотиреозе, диабете, СПКЯ: комплексный подход нутрициолога.',
        mainKeyword: 'как похудеть при гормональном сбое',
        keywordsCount: 50, monthlyVolume: 21566, priority: 2, stage: 2, articlesGoal: 15,
        isReady: false,
        relatedSubcategories: ['pri-klimakse', 'prichiny', 'analizy', 'ne-poluchaetsya'],
      },
      {
        slug: 'bez-diet-bez-sporta', title: 'Без диет и без спорта',
        url: '/blog/pohudenie/bez-diet-bez-sporta/',
        h1: 'Как похудеть без диет и без спорта: метод без вреда здоровью',
        description: 'Метод Натальи Томшиной: как похудеть без диет, без спорта и без вреда здоровью. Без подсчёта калорий. Реальные результаты.',
        mainKeyword: 'как похудеть без диет',
        keywordsCount: 36, monthlyVolume: 74813, priority: 1, stage: 1, articlesGoal: 15,
        isUsp: true,
        isReady: false,
        relatedSubcategories: ['chto-est', 'kak-nachat', 'doma', 'ne-poluchaetsya'],
      },
      {
        slug: 'za-skolko', title: 'За сколько можно похудеть',
        url: '/blog/pohudenie/za-skolko/',
        h1: 'За сколько можно похудеть без вреда: реальные сроки',
        description: 'Сколько килограммов реально сбросить за неделю, месяц или 3 месяца без вреда здоровью. Ответ нутрициолога.',
        mainKeyword: 'как похудеть за месяц',
        keywordsCount: 42, monthlyVolume: 111068, priority: 1, stage: 1, articlesGoal: 14,
        isReady: false,
        relatedSubcategories: ['bystro', 'na-skolko-kg', 'kak-nachat', 'ne-poluchaetsya'],
      },
      {
        slug: 'bystro', title: 'Как быстро похудеть',
        url: '/blog/pohudenie/bystro/',
        h1: 'Как быстро похудеть без вреда здоровью',
        description: 'Разбираем популярные быстрые методы похудения, их риски и реалистичный безопасный темп.',
        mainKeyword: 'как быстро похудеть',
        keywordsCount: 24, monthlyVolume: 104420, priority: 2, stage: 2, articlesGoal: 8,
        isReady: false,
        relatedSubcategories: ['za-skolko', 'na-skolko-kg', 'bez-diet-bez-sporta', 'ne-poluchaetsya'],
      },
      {
        slug: 'na-skolko-kg', title: 'Похудеть на X кг',
        url: '/blog/pohudenie/na-skolko-kg/',
        h1: 'Как похудеть на 5, 10, 15, 20 кг — реальные сроки',
        description: 'Сколько времени реально занимает похудение на определённый вес. Гайды для каждой цели.',
        mainKeyword: 'как похудеть на 10 кг',
        keywordsCount: 17, monthlyVolume: 51932, priority: 2, stage: 2, articlesGoal: 8,
        isReady: false,
        relatedSubcategories: ['za-skolko', 'bystro', 'kbzhu', 'zhivot-boka'],
      },
      {
        slug: 'chto-est', title: 'Что есть при похудении',
        url: '/blog/pohudenie/chto-est/',
        h1: 'Что есть при похудении: полный гид по питанию',
        description: 'Какие продукты есть при похудении, что на завтрак, обед, ужин. Список разрешённых и запрещённых продуктов.',
        mainKeyword: 'что есть при похудении',
        keywordsCount: 77, monthlyVolume: 153416, priority: 1, stage: 1, articlesGoal: 25,
        isReady: false,
        relatedSubcategories: ['kbzhu', 'bez-diet-bez-sporta', 'prichiny', 'doma'],
      },
      {
        slug: 'kbzhu', title: 'КБЖУ и калории',
        url: '/blog/pohudenie/kbzhu/',
        h1: 'КБЖУ для похудения: как правильно рассчитать',
        description: 'Расчёт КБЖУ для женщин, калькулятор калорий, нормы белков-жиров-углеводов для похудения.',
        mainKeyword: 'кбжу для похудения',
        keywordsCount: 45, monthlyVolume: 79035, priority: 2, stage: 2, articlesGoal: 15,
        hasCalculator: true,
        isReady: false,
        relatedSubcategories: ['chto-est', 'za-skolko', 'prichiny', 'ne-poluchaetsya'],
      },
      {
        slug: 'prichiny', title: 'Лишний вес: причины',
        url: '/blog/pohudenie/prichiny/',
        h1: 'Причины лишнего веса у женщин',
        description: 'Почему у женщин после 35-40 появляется лишний вес: гормоны, метаболизм, образ жизни, стрессы.',
        mainKeyword: 'лишний вес у женщин причины',
        keywordsCount: 48, monthlyVolume: 33303, priority: 2, stage: 2, articlesGoal: 15,
        isReady: false,
        relatedSubcategories: ['ne-poluchaetsya', 'pri-gormonalnyh-sboyah', 'analizy', 'kbzhu'],
      },
      {
        slug: 'ne-poluchaetsya', title: 'Не могу похудеть',
        url: '/blog/pohudenie/ne-poluchaetsya/',
        h1: 'Не могу похудеть: что делать',
        description: 'Почему не получается похудеть, что мешает, какие ошибки допускают женщины и как их исправить.',
        mainKeyword: 'не могу похудеть',
        keywordsCount: 23, monthlyVolume: 29651, priority: 2, stage: 2, articlesGoal: 10,
        isReady: false,
        relatedSubcategories: ['prichiny', 'pri-gormonalnyh-sboyah', 'kbzhu', 'analizy'],
      },
      {
        slug: 'zhivot-boka', title: 'Живот, бока и проблемные зоны',
        url: '/blog/pohudenie/zhivot-boka/',
        h1: 'Как убрать живот и бока женщине',
        description: 'Похудение проблемных зон: живот, бока, бёдра, талия. Работающие методы для женщин после 40.',
        mainKeyword: 'как убрать живот женщине',
        keywordsCount: 19, monthlyVolume: 41772, priority: 2, stage: 2, articlesGoal: 8,
        isReady: false,
        relatedSubcategories: ['na-skolko-kg', 'chto-est', 'kbzhu', 'zhirosjiganie'],
      },
      {
        slug: 'doma', title: 'В домашних условиях',
        url: '/blog/pohudenie/doma/',
        h1: 'Как похудеть в домашних условиях',
        description: 'Похудение без спортзала и дорогих продуктов: через питание дома. Гид нутрициолога.',
        mainKeyword: 'как похудеть в домашних условиях',
        keywordsCount: 14, monthlyVolume: 17089, priority: 3, stage: 3, articlesGoal: 7,
        isReady: false,
        relatedSubcategories: ['bez-diet-bez-sporta', 'chto-est', 'kak-nachat', 'bystro'],
      },
      {
        slug: 'zhirosjiganie', title: 'Жиросжигание',
        url: '/blog/pohudenie/zhirosjiganie/',
        h1: 'Жиросжигание: как запустить процесс',
        description: 'Как работает процесс жиросжигания, что реально помогает, а что нет. Разбор нутрициолога.',
        mainKeyword: 'жиросжигание',
        keywordsCount: 29, monthlyVolume: 22719, priority: 3, stage: 3, articlesGoal: 10,
        isReady: false,
        relatedSubcategories: ['kbzhu', 'chto-est', 'bystro', 'zhivot-boka'],
      },
      {
        slug: 'kak-nachat', title: 'С чего начать похудение',
        url: '/blog/pohudenie/kak-nachat/',
        h1: 'Как начать худеть: первые шаги',
        description: 'Пошаговый план: с чего начать похудение, как настроиться, что изменить в питании на старте.',
        mainKeyword: 'с чего начать похудение',
        keywordsCount: 8, monthlyVolume: 15952, priority: 3, stage: 3, articlesGoal: 7,
        isReady: false,
        relatedSubcategories: ['bez-diet-bez-sporta', 'chto-est', 'za-skolko', 'doma'],
      },
      {
        slug: 'analizy', title: 'Анализы перед похудением',
        url: '/blog/pohudenie/analizy/',
        h1: 'Какие анализы сдать перед похудением',
        description: 'Чек-лист анализов для женщины перед похудением: гормоны, сахар, дефициты. Мост к разделу БАДов.',
        mainKeyword: 'анализы перед похудением',
        keywordsCount: 4, monthlyVolume: 3409, priority: 3, stage: 3, articlesGoal: 5,
        isReady: false,
        relatedSubcategories: ['pri-gormonalnyh-sboyah', 'prichiny', 'ne-poluchaetsya', 'posle-50'],
      },
      {
        slug: 'otzyvy', title: 'Реальные отзывы и истории',
        url: '/blog/pohudenie/otzyvy/',
        h1: 'Реальные отзывы о похудении с нутрициологом',
        description: 'Истории похудения женщин 35-60: фото до/после, изменения в самочувствии, результаты участниц клуба.',
        mainKeyword: 'как похудеть отзывы',
        keywordsCount: 95, monthlyVolume: 398608, priority: 3, stage: 3, articlesGoal: 15,
        isReady: false,
        relatedSubcategories: ['posle-40', 'posle-50', 'bez-diet-bez-sporta', 'kak-nachat'],
      },
    ] as SubcategoryData[],
  },
  zdorovye: {
    label: 'Здоровье',
    emoji: '💚',
    description: 'Здоровье изнутри: кишечник, иммунитет, энергия и восстановление. Всё, что влияет на самочувствие и качество жизни.',
    color: '#E8FFF4',
    subcategories: {
      'kishechnik': 'Кишечник и пищеварение',
      'energiya': 'Энергия и усталость',
      'son': 'Сон и восстановление',
      'immunitet': 'Иммунитет',
    },
  },
  gormony: {
    label: 'Гормоны',
    emoji: '🔬',
    description: 'Гормональный баланс — основа здоровья женщины. Инсулин, эстроген, кортизол, щитовидная железа и их влияние на вес.',
    color: '#F5E8FF',
    subcategories: {
      'estrogen': 'Эстроген и менопауза',
      'kortizol': 'Кортизол и стресс',
      'shchitovidka': 'Щитовидная железа',
      'insulin': 'Инсулин',
    },
  },
  diety: {
    label: 'Питание',
    emoji: '🥗',
    description: 'Правила питания для гормонального баланса. Белки, жиры, углеводы, режим питания и продукты для здоровья женщины после 40.',
    color: '#FFF8E8',
    subcategories: {
      'osnovy': 'Основы питания',
      'produkty': 'Полезные продукты',
      'rezhim': 'Режим питания',
      'lechebnoe': 'Лечебное питание',
    },
  },
  bady: {
    label: 'БАДы и витамины',
    emoji: '💊',
    description: 'Какие витамины и добавки нужны женщине после 40. Омега-3, витамины группы B, магний, пробиотики — обзоры и рекомендации.',
    color: '#FFF0E8',
    subcategories: {
      'vitaminy': 'Витамины',
      'mineraly': 'Минералы и микроэлементы',
      'omega': 'Омега-3 и жирные кислоты',
      'probiotiki': 'Пробиотики',
    },
  },
} as const

export type SiloCategory = keyof typeof SILO_CONFIG
export type SiloSubcategory<T extends SiloCategory> = keyof typeof SILO_CONFIG[T]['subcategories']

export function isSiloCategory(slug: string): slug is SiloCategory {
  return slug in SILO_CONFIG
}

export function getSiloLabel(category: string): string {
  return SILO_CONFIG[category as SiloCategory]?.label ?? category
}

export function getSiloSubLabel(category: string, subcategory: string): string {
  const cat = SILO_CONFIG[category as SiloCategory]
  if (!cat) return subcategory
  return (cat.subcategories as Record<string, string>)[subcategory] ?? subcategory
}

// Article URL builder
export function getArticleUrl(post: { slug: string; category?: string | null; subcategory?: string | null }): string {
  if (post.category && post.subcategory && isSiloCategory(post.category)) {
    return `/blog/${post.category}/${post.subcategory}/${post.slug}`
  }
  return `/blog/${post.slug}`
}

// ─── POHUDENIE pillar groups (for UI grouping on /blog/pohudenie/) ────────────

export const POHUDENIE_GROUPS = [
  {
    label: 'По возрасту и состоянию',
    slugs: ['posle-40', 'posle-50', 'posle-60', 'pri-klimakse', 'pri-gormonalnyh-sboyah'],
  },
  {
    label: 'По подходу',
    slugs: ['bez-diet-bez-sporta', 'chto-est', 'kbzhu', 'doma'],
  },
  {
    label: 'По срокам и результатам',
    slugs: ['za-skolko', 'bystro', 'na-skolko-kg'],
  },
  {
    label: 'Решение проблем',
    slugs: ['ne-poluchaetsya', 'prichiny', 'zhivot-boka', 'analizy'],
  },
  {
    label: 'Начало пути',
    slugs: ['kak-nachat', 'zhirosjiganie', 'otzyvy'],
  },
] as const

// ─── Recipes ─────────────────────────────────────────────────────────────────

export const RECIPES_CONFIG = {
  'pri-insulinorezistentnosti': {
    label: 'При инсулинорезистентности',
    emoji: '🩸',
    title: 'Рецепты при инсулинорезистентности: питание для нормализации инсулина',
    description: 'Рецепты нутрициолога Натальи Томшиной для женщин с инсулинорезистентностью. Белковые блюда без сахара и быстрых углеводов.',
    intro: 'При инсулинорезистентности важно убрать скачки глюкозы. Эти рецепты построены на белке, некрахмалистых овощах и полезных жирах — именно то, что помогает нормализовать инсулин.',
  },
  'pri-klimakse': {
    label: 'При климаксе и менопаузе',
    emoji: '🌸',
    title: 'Рецепты при климаксе: питание для гормонального баланса',
    description: 'Рецепты для женщин в менопаузе от нутрициолога Натальи Томшиной. Поддержка гормонального баланса через питание.',
    intro: 'В период менопаузы организм особенно чувствителен к углеводам и сахару. Эти рецепты помогают поддержать гормональный баланс и контролировать вес без голода.',
  },
  'pri-diabete': {
    label: 'При диабете 2 типа',
    emoji: '💉',
    title: 'Рецепты при диабете 2 типа: контроль сахара через питание',
    description: 'Рецепты для контроля сахара в крови при диабете 2 типа. Нутрициолог Наталья Томшина — о питании без резких скачков глюкозы.',
    intro: 'Рецепты с низким гликемическим индексом, без сахара и быстрых углеводов. Помогают держать глюкозу в норме и снижать вес при диабете 2 типа.',
  },
  'pri-gipotireoze': {
    label: 'При гипотиреозе',
    emoji: '🦋',
    title: 'Рецепты при гипотиреозе: питание для поддержки щитовидной железы',
    description: 'Рецепты нутрициолога Натальи Томшиной для женщин с гипотиреозом. Без зобогенных продуктов, с нужными нутриентами.',
    intro: 'При гипотиреозе важно исключить продукты, угнетающие щитовидную железу, и добавить те, что поддерживают её работу. Эти рецепты составлены с учётом этих требований.',
  },
  'dlya-pokhudeniya': {
    label: 'Для похудения',
    emoji: '⚖️',
    title: 'Рецепты для похудения женщин 40+: без голода и подсчёта калорий',
    description: 'Рецепты для снижения веса от нутрициолога Натальи Томшиной. Сытные блюда на белке и овощах — без голода и диет.',
    intro: 'Рецепты, которые насыщают надолго и не провоцируют скачки инсулина. Подходят для похудения без подсчёта калорий и постоянного чувства голода.',
  },
  'bez-sakhara': {
    label: 'Без сахара',
    emoji: '🚫',
    title: 'Рецепты без сахара: вкусно и полезно для гормонального здоровья',
    description: 'Рецепты без сахара и сахарозаменителей от нутрициолога Натальи Томшиной. Десерты, завтраки и основные блюда.',
    intro: 'Сахар — главный враг гормонального баланса. Эти рецепты доказывают, что без сахара можно есть вкусно, сытно и разнообразно.',
  },
  'vysokobelkovye': {
    label: 'Высокобелковые',
    emoji: '💪',
    title: 'Высокобелковые рецепты для женщин: сытость и гормональный баланс',
    description: 'Рецепты с высоким содержанием белка от нутрициолога Натальи Томшиной. Белок — основа насыщения и метаболического здоровья.',
    intro: 'Белок — ключевой нутриент для насыщения, мышечной массы и гормонального здоровья. Эти рецепты помогают легко набирать нужное количество белка каждый день.',
  },
  'zavtraki': {
    label: 'Завтраки',
    emoji: '🍳',
    title: 'Белковые завтраки для похудения: рецепты без сахара',
    description: 'Рецепты белковых завтраков от нутрициолога Натальи Томшиной. Запускают метаболизм и дают сытость на 4–5 часов.',
    intro: 'Правильный завтрак задаёт тон всему дню. Белок с утра — это стабильный инсулин, долгая сытость и отсутствие тяги к сладкому к обеду.',
  },
} as const

export type RecipeCategory = keyof typeof RECIPES_CONFIG

// ─── Menyu ───────────────────────────────────────────────────────────────────

export const MENYU_CONFIG = {
  'dlya-pokhudeniya': {
    label: 'Для похудения',
    icon: '⚖️',
    title: 'Меню для похудения женщин 40+',
    description: 'Готовые меню для здорового снижения веса без голода и подсчёта калорий.',
  },
  'pri-insulinorezistentnosti': {
    label: 'При инсулинорезистентности',
    icon: '🔴',
    title: 'Меню при инсулинорезистентности',
    description: 'Сбалансированные меню для контроля инсулинорезистентности.',
  },
  'pri-klimakse': {
    label: 'При климаксе',
    icon: '🌸',
    title: 'Меню при климаксе и менопаузе',
    description: 'Питание для комфортного прохождения менопаузы.',
  },
  'pri-diabete': {
    label: 'При диабете 2 типа',
    icon: '📊',
    title: 'Меню при диабете 2 типа',
    description: 'Безопасные меню для контроля сахара в крови.',
  },
  'pri-gipotireoze': {
    label: 'При гипотиреозе',
    icon: '💊',
    title: 'Меню при гипотиреозе',
    description: 'Поддержка щитовидной железы через правильное питание.',
  },
  'ot-nutriciologa': {
    label: 'От нутрициолога',
    icon: '👩‍⚕️',
    title: 'Меню от нутрициолога Натальи Томшиной',
    description: 'Профессиональные рационы питания от нутрициолога Натальи Томшиной.',
  },
} as const

export type MenyuCategory = keyof typeof MENYU_CONFIG
