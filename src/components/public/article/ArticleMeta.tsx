export default function ArticleMeta() {
  return (
    <div className="author-block" itemScope itemType="https://schema.org/Person">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/authors/natalia.jpg" alt="Наталья Томшина — нутрициолог" width={64} height={64} />
      <div className="author-info">
        <p className="author-name" itemProp="name">Наталья Томшина</p>
        <p className="author-title" itemProp="jobTitle">нутрициолог</p>
        <p className="author-bio" itemProp="description">
          Нутрициолог с практическим опытом более 10 лет. Основатель клуба питания «Вкус Жизни».
          Помогает женщинам 40+ нормализовать вес и гормональный баланс через систему питания без запретов.
        </p>
      </div>
    </div>
  )
}
