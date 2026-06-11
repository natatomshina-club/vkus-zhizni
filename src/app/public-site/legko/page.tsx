import type { Metadata } from 'next'
import LegkoLanding from './LegkoLanding'

export const metadata: Metadata = {
  title: 'Лёгкость перемен — программа восстановления женского здоровья · Наталья Томшина',
  description: 'Трёхмесячный практикум нутрициолога Натальи Томшиной по восстановлению работы ЖКТ, желчного пузыря, щитовидной железы и гормональной системы. Без лекарств — через питание.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/legko',
  },
  openGraph: {
    title: 'Лёгкость перемен — программа восстановления женского здоровья',
    description: 'Избавьтесь от боли, вздутия и хронической усталости. Программа нутрициолога Натальи Томшиной — через питание, без лекарств.',
    url: 'https://nata-tomshina.ru/legko',
    type: 'website',
  },
}

export default function LegkoPage() {
  return <LegkoLanding />
}
