export type ShoppingItem = { name: string; amount: string }
export type ShoppingCategory = { icon: string; name: string; items: ShoppingItem[] }

const SHOPPING_LIST: ShoppingCategory[] = [
  {
    icon: '🥩',
    name: 'Мясо и рыба',
    items: [
      { name: 'куриные бёдра без кожи', amount: '300 г' },
      { name: 'фарш говяжий', amount: '80 г' },
      { name: 'филе индейки', amount: '300 г' },
      { name: 'домашний фарш (говядина 70%, свинина 30%)', amount: '200 г' },
      { name: 'говяжий фарш 10%', amount: '240 г' },
      { name: 'говядина (мякоть бедра)', amount: '240 г' },
      { name: 'грудка индейки', amount: '240 г' },
      { name: 'креветки очищенные', amount: '300 г' },
      { name: 'бекон', amount: '40 г' },
    ],
  },
  {
    icon: '🥬',
    name: 'Овощи и зелень',
    items: [
      { name: 'цветная капуста', amount: '250 г' },
      { name: 'огурцы', amount: '700 г' },
      { name: 'помидоры', amount: '700 г' },
      { name: 'листовой салат', amount: '460 г' },
      { name: 'морковь', amount: '420 г' },
      { name: 'лук репчатый', amount: '460 г' },
      { name: 'кабачок', amount: '300 г' },
      { name: 'брокколи', amount: '150 г' },
      { name: 'болгарский перец', amount: '100 г' },
      { name: 'картофель', amount: '150 г' },
      { name: 'стручковая фасоль', amount: '200 г' },
      { name: 'чеснок', amount: '3 зубчика' },
    ],
  },
  {
    icon: '🧀',
    name: 'Молочные продукты и яйца',
    items: [
      { name: 'сметана 25%', amount: '40 г' },
      { name: 'сметана 20%', amount: '145 г' },
      { name: 'сливочное масло', amount: '20 г' },
      { name: 'топлёное масло', amount: '185 г' },
      { name: 'сливки 20%', amount: '320 г' },
      { name: 'сыр пармезан или другой твёрдый', amount: '110 г' },
      { name: 'яйца', amount: '16 шт. (около 880 г)' },
    ],
  },
  {
    icon: '🌾',
    name: 'Зерновые и крупы',
    items: [
      { name: 'гречка сухая', amount: '160 г' },
      { name: 'рис отварной', amount: '200 г' },
    ],
  },
  {
    icon: '🫒',
    name: 'Масла и соусы',
    items: [
      { name: 'оливковое масло для заправки', amount: '95 г' },
      { name: 'оливковое масло для жарки', amount: '40 г' },
      { name: 'томатная паста', amount: '40 г' },
    ],
  },
  {
    icon: '🧂',
    name: 'Специи и добавки',
    items: [
      { name: 'соль, перец, паприка, лавровый лист', amount: 'по вкусу' },
      { name: 'зелень (петрушка, укроп)', amount: 'по вкусу' },
      { name: 'ванилин (для сырников)', amount: 'щепотка' },
    ],
  },
]

export default SHOPPING_LIST
