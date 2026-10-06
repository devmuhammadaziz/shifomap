'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { CalendarCheck, House, Loader2, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { useToast } from '@/contexts/toast-context'
import { getApiUrl } from '@/lib/api'

type ClinicSettings = {
  reviewsEnabled: boolean
  bookingEnabled: boolean
  homeVisit: { enabledCount: number; totalDoctors: number }
}

function authHeaders(): HeadersInit {
  const token = Cookies.get('clinic_auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const TEXT = {
  uz: {
    loadError: "Sozlamalarni yuklab bo'lmadi",
    saveError: "Saqlab bo'lmadi. Qaytadan urinib ko'ring.",
    saved: 'Saqlandi',
    on: 'Yoqilgan',
    off: "O'chirilgan",
    reviewsTitle: 'Reyting va sharhlar',
    reviewsDesc:
      "O'chirilsa, mobil ilovada klinikangiz, xizmatlar va shifokorlar reytingi, yulduzchalar va sharhlar ko'rsatilmaydi, foydalanuvchilar yangi sharh qoldira olmaydi. Mavjud sharhlar o'chirilmaydi — qayta yoqsangiz, hammasi yana ko'rinadi.",
    bookingTitle: 'Onlayn yozilish',
    bookingDesc:
      "O'chirilsa, foydalanuvchilar mobil ilovada klinikangiz xizmatlari va shifokorlariga yozila olmaydi. Ular o'rniga “Bu klinikaga hozircha onlayn yozilib bo'lmaydi” degan xabarni ko'radi. Mavjud yozuvlar saqlanib qoladi.",
    homeTitle: 'Shifokorni uyga chaqirish',
    homeDesc:
      "Qaysi shifokorlarni uyga chaqirish mumkinligini boshqaring. Ruxsat berilmagan shifokor sahifasida foydalanuvchi “Bu shifokorni uyga chaqirib bo'lmaydi” degan xabarni ko'radi.",
    homeCount: (n: number, total: number) => `${total} ta shifokordan ${n} tasini uyga chaqirish mumkin`,
    enableAll: 'Hammasiga ruxsat berish',
    disableAll: "Hammasini o'chirish",
    perDoctor: 'Har bir shifokor uchun alohida sozlash →',
    allEnabled: 'Barcha shifokorlarni uyga chaqirish yoqildi',
    allDisabled: "Barcha shifokorlarni uyga chaqirish o'chirildi",
  },
  ru: {
    loadError: 'Не удалось загрузить настройки',
    saveError: 'Не удалось сохранить. Попробуйте ещё раз.',
    saved: 'Сохранено',
    on: 'Включено',
    off: 'Выключено',
    reviewsTitle: 'Рейтинг и отзывы',
    reviewsDesc:
      'Если выключить, в мобильном приложении не будут показываться рейтинг, звёзды и отзывы вашей клиники, услуг и врачей, а пользователи не смогут оставить новый отзыв. Существующие отзывы не удаляются — после включения всё снова появится.',
    bookingTitle: 'Онлайн-запись',
    bookingDesc:
      'Если выключить, пользователи не смогут записаться к вашим врачам и на услуги в мобильном приложении. Вместо кнопки они увидят сообщение «Онлайн-запись в эту клинику сейчас недоступна». Существующие записи сохраняются.',
    homeTitle: 'Вызов врача на дом',
    homeDesc:
      'Управляйте тем, каких врачей можно вызвать на дом. На странице врача без разрешения пользователь увидит сообщение «Этого врача нельзя вызвать на дом».',
    homeCount: (n: number, total: number) => `Вызов на дом доступен для ${n} из ${total} врачей`,
    enableAll: 'Разрешить всем',
    disableAll: 'Запретить всем',
    perDoctor: 'Настроить для каждого врача →',
    allEnabled: 'Вызов на дом включён для всех врачей',
    allDisabled: 'Вызов на дом выключен для всех врачей',
  },
} as const

function Switch({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export function ClinicFeatureSettings() {
  const { language } = useLanguage()
  const tx = TEXT[language === 'ru' ? 'ru' : 'uz']
  const { toast } = useToast()
  const apiUrl = getApiUrl()
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<null | 'reviews' | 'booking' | 'homeAll'>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/v1/clinics/my-clinic/settings`, { headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) throw new Error(json?.error || tx.loadError)
      setSettings(json.data)
    } catch (e) {
      toast((e as Error).message || tx.loadError, 'error')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, toast, tx.loadError])

  useEffect(() => {
    void load()
  }, [load])

  const updateFlag = async (key: 'reviewsEnabled' | 'bookingEnabled', value: boolean) => {
    if (!settings) return
    const prev = settings
    setSettings({ ...settings, [key]: value })
    setSaving(key === 'reviewsEnabled' ? 'reviews' : 'booking')
    try {
      const res = await fetch(`${apiUrl}/v1/clinics/my-clinic/settings`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ [key]: value }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) throw new Error(json?.error || tx.saveError)
      setSettings(json.data)
      toast(tx.saved)
    } catch (e) {
      setSettings(prev)
      toast((e as Error).message || tx.saveError, 'error')
    } finally {
      setSaving(null)
    }
  }

  const setAllHomeVisit = async (enabled: boolean) => {
    setSaving('homeAll')
    try {
      const res = await fetch(`${apiUrl}/v1/clinics/my-clinic/doctors/home-visit`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ enabled }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) throw new Error(json?.error || tx.saveError)
      toast(enabled ? tx.allEnabled : tx.allDisabled)
      await load()
    } catch (e) {
      toast((e as Error).message || tx.saveError, 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (!settings) return null

  const rows = [
    {
      key: 'reviewsEnabled' as const,
      icon: Star,
      title: tx.reviewsTitle,
      desc: tx.reviewsDesc,
      value: settings.reviewsEnabled,
      busy: saving === 'reviews',
    },
    {
      key: 'bookingEnabled' as const,
      icon: CalendarCheck,
      title: tx.bookingTitle,
      desc: tx.bookingDesc,
      value: settings.bookingEnabled,
      busy: saving === 'booking',
    },
  ]

  const { enabledCount, totalDoctors } = settings.homeVisit

  return (
    <div className="space-y-6">
      {rows.map((row) => (
        <Card key={row.key}>
          <CardContent className="flex items-start gap-4 p-6">
            <div className={`rounded-xl p-3 ${row.value ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              <row.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{row.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {row.value ? tx.on : tx.off}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{row.desc}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {row.busy && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
              <Switch
                checked={row.value}
                disabled={saving !== null}
                label={row.title}
                onChange={(v) => void updateFlag(row.key, v)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className={`rounded-xl p-3 ${enabledCount > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <House className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{tx.homeTitle}</CardTitle>
            <CardDescription className="mt-1 leading-relaxed">{tx.homeDesc}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <span className="mr-auto text-sm font-medium text-gray-700">{tx.homeCount(enabledCount, totalDoctors)}</span>
          <Button
            variant="outline"
            disabled={saving !== null || totalDoctors === 0 || enabledCount === totalDoctors}
            onClick={() => void setAllHomeVisit(true)}
          >
            {saving === 'homeAll' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {tx.enableAll}
          </Button>
          <Button
            variant="outline"
            disabled={saving !== null || totalDoctors === 0 || enabledCount === 0}
            onClick={() => void setAllHomeVisit(false)}
          >
            {tx.disableAll}
          </Button>
          <Link href="/dashboard/accounts?tab=doctors" className="w-full text-sm font-medium text-blue-600 hover:underline">
            {tx.perDoctor}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
