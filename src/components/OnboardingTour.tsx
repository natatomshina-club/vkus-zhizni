'use client'
import { useEffect } from 'react'
import 'driver.js/dist/driver.css'

interface Props {
  memberId: string
  tourCompleted: boolean | null | undefined
}

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

export default function OnboardingTour({ tourCompleted }: Props) {
  useEffect(() => {
    console.log('[OnboardingTour] useEffect triggered, tourCompleted=', tourCompleted)

    // Ждём пока данные участницы точно загружены
    if (tourCompleted === undefined) {
      console.log('[OnboardingTour] waiting for data...')
      return
    }
    // Ловим и false, и null — у существующих участниц может быть null
    if (tourCompleted) {
      console.log('[OnboardingTour] already completed, skip')
      return
    }

    console.log('[OnboardingTour] starting tour init...')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let driverInstance: any = null
    let cancelled = false

    async function init() {
      if (cancelled) return

      const { driver } = await import('driver.js')

      if (cancelled) return

      // Skip steps whose element is not present in the DOM
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
        console.log('[OnboardingTour] drive() запускается, steps:', steps.length)
        driverInstance?.drive()

        // Сохраняем флаг только после успешного запуска тура
        // Закрыла крестиком или прошла до конца — не важно, больше не покажем
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
