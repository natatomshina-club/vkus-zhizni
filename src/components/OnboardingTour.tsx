'use client'
import { useState, useEffect } from 'react'
import 'driver.js/dist/driver.css'

const ALL_STEPS = [
  {
    element: '[data-tour="dashboard-kitchen"]',
    popover: {
      title: '🍳 Умная кухня',
      description: 'Напиши какие продукты у тебя есть — система подберёт рецепт и автоматически посчитает твои КБЖУ',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-favorites"]',
    popover: {
      title: '❤️ Избранные рецепты',
      description: 'Сохраняй любимые рецепты прямо из Умной кухни',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-diary"]',
    popover: {
      title: '📖 Дневник питания',
      description: 'Записывай каждый день что ела и как себя чувствовала. Это важно для прогресса!',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-tracker"]',
    popover: {
      title: '📊 Трекер замеров',
      description: 'Еженедельно фиксируй вес и объёмы — видишь прогресс, держишь мотивацию',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-courses"]',
    popover: {
      title: '📚 Курсы',
      description: 'Вводные уроки о системе питания. Сразу поймёшь как работает организм для здорового похудения',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-body"]',
    popover: {
      title: '🦋 Я и моё тело',
      description: 'Уроки по метаболизму, гормонам, здоровью и многому другому',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-webinars"]',
    popover: {
      title: '🎥 Вебинары',
      description: 'Разные темы. Можно купить отдельно, а можно получить бесплатно за статус в клубе',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-meditations"]',
    popover: {
      title: '🧘 Медитации',
      description: 'Слушай в любое время для расслабления. Это важно для прогресса',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-marathon"]',
    popover: {
      title: '🏃 Марафоны',
      description: 'Каждый месяц новый марафон и вызов себе — включён в полную подписку',
      side: 'bottom' as const,
    },
  },
  {
    element: '[data-tour="dashboard-channel"]',
    popover: {
      title: '💬 Чаты клуба',
      description: 'Все участницы рядом — задай вопрос, поделись результатом, напиши Наташе лично!',
      side: 'bottom' as const,
    },
  },
  {
    popover: {
      title: '🎉 Добро пожаловать в клуб!',
      description: 'Всё готово! Начни с Умной кухни — напиши что есть в холодильнике и получи первый рецепт.',
    },
  },
]

// Загружаем статус тура сами на клиенте — не полагаемся на серверный проп.
// undefined = ещё загружаем, true = тур уже был, false = показать тур.
export default function OnboardingTour() {
  const [tourCompleted, setTourCompleted] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    fetch('/api/member/me')
      .then(r => r.json())
      .then((data: { member?: { tour_completed?: boolean | null } }) => {
        // treat null / undefined / false → show tour; true → skip
        setTourCompleted(data.member?.tour_completed === true)
      })
      .catch(() => setTourCompleted(true)) // при ошибке не мешаем пользователю
  }, [])

  useEffect(() => {
    // undefined → данные ещё не загружены, ждём
    if (tourCompleted === undefined) return
    // true → тур уже пройден
    if (tourCompleted === true) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let driverInstance: any = null
    let cancelled = false

    async function init() {
      if (cancelled) return

      const { driver } = await import('driver.js')

      if (cancelled) return

      // Фильтруем шаги: оставляем только те, чьи элементы есть в DOM
      const steps = ALL_STEPS.filter(step => {
        if (!('element' in step)) return true
        return !!document.querySelector(step.element as string)
      })

      driverInstance = driver({
        showProgress: true,
        progressText: '{{current}} из {{total}}',
        nextBtnText: 'Далее →',
        prevBtnText: '← Назад',
        doneBtnText: 'Начать! 🎉',
        allowClose: true,
        overlayOpacity: 0.65,
        stagePadding: 12,
        stageRadius: 16,
        steps,
        popoverClass: 'vkus-tour-popover',
        onDestroyStarted: () => {
          driverInstance?.destroy()
        },
      })

      // 800мс — страница успевает полностью отрендериться и гидрироваться
      setTimeout(() => {
        if (cancelled) return
        driverInstance?.drive()

        // Помечаем тур пройденным сразу после запуска
        // (закрыла крестиком или дошла до конца — больше не показываем)
        setTimeout(async () => {
          if (cancelled) return
          try {
            await fetch('/api/onboarding/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ onboarding_completed: true }),
            })
          } catch { /* silent */ }
        }, 1000)
      }, 800)
    }

    init()

    return () => {
      cancelled = true
      driverInstance?.destroy()
    }
  }, [tourCompleted])

  return null
}
