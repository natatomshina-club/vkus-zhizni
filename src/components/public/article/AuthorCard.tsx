import Image from 'next/image'

type Props = {
  variant?: 'full' | 'compact'
}

const AUTHOR = {
  name: 'Наталья Томшина',
  role: 'нутрициолог',
  photoUrl: '/images/authors/natalia.jpg',
  bio: 'Нутрициолог с практическим опытом более 10 лет. Основатель клуба питания «Вкус Жизни». Помогает женщинам 40+ нормализовать вес и гормональный баланс через систему питания без запретов.',
} as const

export function AuthorCard({ variant = 'full' }: Props) {
  if (variant === 'compact') {
    return (
      <div className="author-card author-card--compact">
        <strong>{AUTHOR.name}</strong> · {AUTHOR.role}
      </div>
    )
  }

  return (
    <div className="author-card">
      <div className="author-card__photo">
        <Image
          src={AUTHOR.photoUrl}
          alt={AUTHOR.name}
          fill
          sizes="88px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="author-card__content">
        <div className="author-card__name">{AUTHOR.name}</div>
        <div className="author-card__role">{AUTHOR.role}</div>
        <p className="author-card__bio">{AUTHOR.bio}</p>
      </div>
    </div>
  )
}
