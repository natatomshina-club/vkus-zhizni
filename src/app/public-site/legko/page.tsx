import type { Metadata } from 'next'
import LegkoLanding from './LegkoLanding'

const PAGE_URL = 'https://nata-tomshina.ru/legko'
const OG_IMAGE = 'https://nata-tomshina.ru/images/og/legko.webp'

export const metadata: Metadata = {
  title: 'Лёгкость перемен — программа восстановления женского здоровья · Наталья Томшина',
  description: 'Трёхмесячный практикум нутрициолога Натальи Томшиной по восстановлению работы ЖКТ, желчного пузыря, щитовидной железы и гормональной системы. Без лекарств — через питание.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Лёгкость перемен — программа восстановления женского здоровья',
    description: 'Избавьтесь от боли, вздутия и хронической усталости. Программа нутрициолога Натальи Томшиной — через питание, без лекарств.',
    url: PAGE_URL,
    type: 'website',
    siteName: 'Наталья Томшина — нутрициолог',
    locale: 'ru_RU',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Лёгкость перемен — программа восстановления женского здоровья · Наталья Томшина',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лёгкость перемен — программа восстановления женского здоровья',
    description: 'Избавьтесь от боли, вздутия и хронической усталости. Программа нутрициолога Натальи Томшиной — через питание, без лекарств.',
    images: [OG_IMAGE],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: 'Лёгкость перемен — программа восстановления женского здоровья',
      description: 'Трёхмесячный практикум нутрициолога Натальи Томшиной по восстановлению работы ЖКТ, желчного пузыря, щитовидной железы и гормональной системы.',
      inLanguage: 'ru',
      isPartOf: { '@id': 'https://nata-tomshina.ru/#website' },
      about: { '@id': `${PAGE_URL}#course` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: OG_IMAGE,
        width: 1200,
        height: 630,
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://nata-tomshina.ru/#organization',
      name: 'Клуб стройных и здоровых «Вкус Жизни»',
      url: 'https://nata-tomshina.ru/',
      founder: { '@id': 'https://nata-tomshina.ru/#person' },
    },
    {
      '@type': 'Person',
      '@id': 'https://nata-tomshina.ru/#person',
      name: 'Наталья Томшина',
      jobTitle: 'Интегративный нутрициолог',
      url: 'https://nata-tomshina.ru/',
      worksFor: { '@id': 'https://nata-tomshina.ru/#organization' },
    },
    {
      '@type': 'Course',
      '@id': `${PAGE_URL}#course`,
      name: 'Лёгкость перемен',
      description: 'Трёхмесячный практикум нутрициолога Натальи Томшиной по восстановлению работы ЖКТ, желчного пузыря, щитовидной железы и гормональной системы без лекарств — через питание.',
      url: PAGE_URL,
      inLanguage: 'ru',
      provider: { '@id': 'https://nata-tomshina.ru/#organization' },
      instructor: { '@id': 'https://nata-tomshina.ru/#person' },
      courseMode: 'online',
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        inLanguage: 'ru',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${PAGE_URL}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Нужно ли сдавать анализы перед курсом?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'В начале курса вы заполняете небольшую анкету, и мы определяем минимальный список необходимых именно вам анализов, чтобы не сдавать ничего лишнего.',
          },
        },
        {
          '@type': 'Question',
          name: 'Сколько времени нужно на уроки и задания?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '2–3 урока по 20–40 минут в неделю. Вам точно хватит времени на изучение уроков, а переход на рацион занимает столько же времени, сколько вы тратите на обычную еду ежедневно.',
          },
        },
        {
          '@type': 'Question',
          name: 'Подойдёт ли мне программа, если у меня удалён жёлчный пузырь?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да. Программа адаптирована для тех, у кого удалён жёлчный пузырь — внутри есть отдельные рекомендации по пищеварению для этой ситуации.',
          },
        },
        {
          '@type': 'Question',
          name: 'Что если курс мне не подойдёт?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Если в течение 7 дней после старта вы поймёте, что метод вам не подходит, — обсудим всё индивидуально. Я заинтересована в вашем результате, а не просто в участии.',
          },
        },
        {
          '@type': 'Question',
          name: 'Могу ли я проходить курс, если живу в другой стране?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, конечно. Курс проходит в онлайн-формате. Также на курсе будут предложены аналоги российских нутрицевтиков, которые можно приобрести на iHerb.',
          },
        },
      ],
    },
  ],
}

export default function LegkoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegkoLanding />
    </>
  )
}
