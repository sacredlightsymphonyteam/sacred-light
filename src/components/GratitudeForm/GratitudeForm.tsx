import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  submitContribution,
  isValidEmail,
  isValidUrl,
  publicName,
  IMAGE_TYPES,
  DOC_TYPES,
  MAX_FILE_BYTES,
  MAX_MESSAGE,
  type Contribution,
} from '../../lib/contributions'
import { COUNTRIES, SALUTATIONS, LANGUAGES } from '../../lib/countries'
import { SITE_URL } from '../../lib/site'
import styles from './GratitudeForm.module.css'

type Step = 'form' | 'review' | 'thankyou'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
function formatToday(): string {
  const d = new Date()
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const MB = (b: number) => `${(b / (1024 * 1024)).toFixed(0)} MB`

/** A single drag-and-drop file field (photo / artwork / document). */
function FileDrop({
  label,
  hint,
  accept,
  allowed,
  file,
  onPick,
  onError,
}: {
  label: string
  hint: string
  accept: string
  allowed: string[]
  file: File | null
  onPick: (f: File | null) => void
  onError: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const choose = (f: File | null) => {
    if (!f) return
    if (!allowed.includes(f.type)) {
      onError(`“${f.name}” isn’t an accepted format for ${label.toLowerCase()}.`)
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      onError(`“${f.name}” is larger than ${MB(MAX_FILE_BYTES)}.`)
      return
    }
    onError('')
    onPick(f)
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div
        className={`${styles.drop} ${dragging ? styles.dropActive : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          choose(e.dataTransfer.files?.[0] ?? null)
        }}
      >
        {file ? (
          <span className={styles.fileName}>
            {file.name}
            <button
              type="button"
              className={styles.fileRemove}
              onClick={(e) => {
                e.stopPropagation()
                onPick(null)
              }}
            >
              remove
            </button>
          </span>
        ) : (
          <>
            <span className={styles.dropText}>Tap to choose, or drag a file here</span>
            <span className={styles.dropSub}>{hint}</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => choose(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

/**
 * Share Your Gratitude — the Book of Gratitude contribution funnel.
 * Three steps in one flow: the form (Page 2), a review/preview (Page 3), and
 * the thank-you page (Page 4). Copy is verbatim from the Funnel Pages brief.
 */
export default function GratitudeForm() {
  const [step, setStep] = useState<Step>('form')
  const today = useMemo(formatToday, [])

  // Section A — your details
  const [salutation, setSalutation] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
  const [city, setCity] = useState('')
  const [website, setWebsite] = useState('')
  const [social, setSocial] = useState('')
  // Section B — your message
  const [title, setTitle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [displayLanguage, setDisplayLanguage] = useState('')
  // Section C — creative
  const [photo, setPhoto] = useState<File | null>(null)
  const [artwork, setArtwork] = useState<File | null>(null)
  const [document, setDocument] = useState<File | null>(null)
  const [musicUrl, setMusicUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  // Sections D & E
  const [newsletter, setNewsletter] = useState(false)
  const [consentOriginal, setConsentOriginal] = useState(false)
  const [consentPublish, setConsentPublish] = useState(false)
  const [consentTranslate, setConsentTranslate] = useState(false)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const data = (): Contribution => ({
    salutation,
    firstName,
    lastName,
    email,
    country,
    language,
    city: city || undefined,
    website: website || undefined,
    social: social || undefined,
    title: title || undefined,
    displayName: displayName || undefined,
    message,
    displayLanguage,
    photo,
    artwork,
    document,
    musicUrl: musicUrl || undefined,
    videoUrl: videoUrl || undefined,
    newsletter,
    consentOriginal,
    consentPublish,
    consentTranslate,
  })

  const validate = (): string => {
    if (!salutation) return 'Please choose a salutation.'
    if (!firstName.trim() || !lastName.trim()) return 'Please enter your first and last name.'
    if (!email.trim() || !isValidEmail(email.trim())) return 'Please enter a valid email address.'
    if (!country) return 'Please choose your country.'
    if (!language) return 'Please choose the language you are writing in.'
    if (!message.trim()) return 'Please write your message of gratitude.'
    if (!displayLanguage) return 'Please choose the language for your message.'
    if (website && !isValidUrl(website)) return 'Please enter a valid website address, or leave it blank.'
    if (musicUrl && !isValidUrl(musicUrl)) return 'Please enter a valid music link, or leave it blank.'
    if (videoUrl && !isValidUrl(videoUrl)) return 'Please enter a valid video link, or leave it blank.'
    if (!consentOriginal || !consentPublish || !consentTranslate)
      return 'Please confirm the consent statements to continue.'
    return ''
  }

  const toReview = (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError('')
    setStep('review')
  }

  const confirmSubmit = async () => {
    setError('')
    setSubmitting(true)
    const result = await submitContribution(data())
    setSubmitting(false)
    if (result.ok) setStep('thankyou')
    else setError(result.error)
  }

  // ── Step 3 — Thank you ────────────────────────────────────────────────
  if (step === 'thankyou') return <ThankYou copied={copied} setCopied={setCopied} />

  // ── Step 2 — Before you submit (review) ───────────────────────────────
  if (step === 'review') {
    const creatives = [
      photo && `Photograph — ${photo.name}`,
      artwork && `Artwork — ${artwork.name}`,
      document && `Document — ${document.name}`,
      musicUrl && `Music — ${musicUrl}`,
      videoUrl && `Video — ${videoUrl}`,
    ].filter(Boolean) as string[]

    return (
      <div className={styles.funnel}>
        <header className={styles.stepHead}>
          <h1 className={styles.heading}>Before You Submit</h1>
          <p className={styles.lead}>Take a moment to read what you have written.</p>
        </header>
        <p className={styles.stepIntro}>
          Your message will appear here, exactly as it will be received. If anything needs adjusting,
          you may return and edit it before submitting.
        </p>

        <div className={styles.preview}>
          <p className={styles.previewAttr}>
            {publicName(data())} · {country}
          </p>
          {title.trim() && <p className={styles.previewTitle}>{title.trim()}</p>}
          <p className={styles.previewMessage}>{message.trim()}</p>
          {creatives.length > 0 && (
            <ul className={styles.previewCreative}>
              {creatives.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button className="sls-cta" onClick={confirmSubmit} disabled={submitting}>
            {submitting ? 'Releasing your light…' : 'Share My Light'}
          </button>
          <button type="button" className={styles.backLink} onClick={() => setStep('form')}>
            Return and edit
          </button>
        </div>
      </div>
    )
  }

  // ── Step 1 — The form ─────────────────────────────────────────────────
  return (
    <div className={styles.funnel}>
      <header className={styles.stepHead}>
        <h1 className={styles.heading}>Share Your Gratitude</h1>
        <p className={styles.lead}>Your words will be held with care.</p>
      </header>

      <div className={styles.poetic}>
        <p>
          Behind the global icon was a woman who showed us that it is possible to move through
          darkness toward light and who never stopped inviting others to do the same. The Book of
          Gratitude was born from that light. It continues through yours.
        </p>
      </div>

      <div className={styles.stepIntro}>
        <p>
          Take your time. There is no rush. What you write here will be carefully reviewed before it
          becomes part of the Book of Gratitude and the Living Constellation of Light.
        </p>
        <p>There are no rules about length, style, or subject. The only invitation is sincerity.</p>
      </div>

      <form className={styles.form} onSubmit={toReview} noValidate>
        {/* ── Section A — Your details ── */}
        <p className={styles.sectionLabel}>Your details</p>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="firstName" className={styles.label}>
              First name <span className={styles.req}>*</span>
            </label>
            <input
              id="firstName"
              className={styles.input}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="lastName" className={styles.label}>
              Last name <span className={styles.req}>*</span>
            </label>
            <input
              id="lastName"
              className={styles.input}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="salutation" className={styles.label}>
            Salutation <span className={styles.req}>*</span>
          </label>
          <select
            id="salutation"
            className={styles.select}
            value={salutation}
            onChange={(e) => setSalutation(e.target.value)}
          >
            <option value="">Please choose…</option>
            {SALUTATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email address <span className={styles.req}>*</span>
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className={styles.hint}>For your confirmation only. It will never appear in the book.</p>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="country" className={styles.label}>
              Country <span className={styles.req}>*</span>
            </label>
            <select
              id="country"
              className={styles.select}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Please choose…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="city" className={styles.label}>
              City
            </label>
            <input
              id="city"
              className={styles.input}
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="language" className={styles.label}>
            Language <span className={styles.req}>*</span>
          </label>
          <select
            id="language"
            className={styles.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">Please choose…</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <p className={styles.hint}>The language you are completing this form in.</p>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="website" className={styles.label}>
              Website
            </label>
            <input
              id="website"
              className={styles.input}
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="social" className={styles.label}>
              Social media
            </label>
            <input
              id="social"
              className={styles.input}
              type="text"
              placeholder="e.g. Instagram handle"
              value={social}
              onChange={(e) => setSocial(e.target.value)}
            />
          </div>
        </div>

        {/* ── Section B — Your message ── */}
        <p className={styles.sectionLabel}>Your message</p>

        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            Title
          </label>
          <input
            id="title"
            className={styles.input}
            type="text"
            placeholder="A short title for your message, if you wish to give it one"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="displayName" className={styles.label}>
            Name to display under your message
          </label>
          <input
            id="displayName"
            className={styles.input}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <p className={styles.hint}>If left blank, your first name will be shown.</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Your gratitude message <span className={styles.req}>*</span>
          </label>
          <textarea
            id="message"
            className={styles.textarea}
            placeholder="Write freely. This is your space."
            maxLength={MAX_MESSAGE}
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className={styles.counter}>
            {message.length} / {MAX_MESSAGE}
          </div>
          <p className={styles.hint}>
            Whether your message is one sentence or several paragraphs, let it come from your heart.
            Perhaps you wish to thank Tina for something she awakened within you. Perhaps you wish to
            honour a memory, a song, a moment, a sharing that changed your life. Or perhaps you simply
            wish to share the light you now choose to carry forward, thanks to Tina being part of your
            life. There is no right way to write — only your own.
          </p>
          <p className={styles.hint}>Your message will be dated {today}.</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="displayLanguage" className={styles.label}>
            Language to display your message in <span className={styles.req}>*</span>
          </label>
          <select
            id="displayLanguage"
            className={styles.select}
            value={displayLanguage}
            onChange={(e) => setDisplayLanguage(e.target.value)}
          >
            <option value="">Please choose…</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <p className={styles.hint}>
            So your message is presented correctly within the Book of Gratitude.
          </p>
        </div>

        {/* ── Section C — Optional creative contribution ── */}
        <p className={styles.sectionLabel}>A creative contribution — optional</p>
        <p className={styles.sectionNote}>
          You are welcome to accompany your message with a creative contribution. All formats are
          optional.
        </p>

        <FileDrop
          label="Photograph"
          hint={`JPG, PNG or WEBP · up to ${MB(MAX_FILE_BYTES)}`}
          accept="image/jpeg,image/png,image/webp"
          allowed={IMAGE_TYPES}
          file={photo}
          onPick={setPhoto}
          onError={setError}
        />
        <FileDrop
          label="Artwork"
          hint={`Image, including Canva designs · up to ${MB(MAX_FILE_BYTES)}`}
          accept="image/jpeg,image/png,image/webp"
          allowed={IMAGE_TYPES}
          file={artwork}
          onPick={setArtwork}
          onError={setError}
        />
        <FileDrop
          label="Word or PDF"
          hint={`A letter or a design · up to ${MB(MAX_FILE_BYTES)}`}
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          allowed={DOC_TYPES}
          file={document}
          onPick={setDocument}
          onError={setError}
        />

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="musicUrl" className={styles.label}>
              Music — link
            </label>
            <input
              id="musicUrl"
              className={styles.input}
              type="text"
              placeholder="A link to a song or recording"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="videoUrl" className={styles.label}>
              Video — link
            </label>
            <input
              id="videoUrl"
              className={styles.input}
              type="text"
              placeholder="YouTube or Vimeo link"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>

        <p className={styles.sectionNote}>
          Not ready yet? That is perfectly fine. Your message alone is already a gift. You may always
          return to add a creative contribution later.
        </p>

        {/* ── Section D — Newsletter ── */}
        <p className={styles.sectionLabel}>Stay close to the light</p>
        <p className={styles.sectionNote}>
          Every two weeks, Sacred Light Symphony shares three newly selected messages from the Book of
          Gratitude, beautifully presented, quietly inspiring. You are invited to receive these, along
          with updates about the growing Living Constellation and Sacred Light Symphony’s unfolding.
        </p>
        <div className={styles.field}>
          <label className={styles.consent}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
            />
            <span>
              Yes, I would love to receive the Sacred Light Symphony newsletter. I understand I may
              unsubscribe at any time.
            </span>
          </label>
        </div>

        {/* ── Section E — Consent ── */}
        <p className={styles.sectionLabel}>Consent</p>
        <div className={styles.field}>
          <label className={styles.consent}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={consentOriginal}
              onChange={(e) => setConsentOriginal(e.target.checked)}
            />
            <span>
              I confirm this is my own original message, or that I have full permission to share it.
              <span className={styles.req}> *</span>
            </span>
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.consent}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={consentPublish}
              onChange={(e) => setConsentPublish(e.target.checked)}
            />
            <span>
              I agree that Sacred Light Symphony may publish my contribution within the Book of
              Gratitude and share it freely with the world in any form.
              <span className={styles.req}> *</span>
            </span>
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.consent}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={consentTranslate}
              onChange={(e) => setConsentTranslate(e.target.checked)}
            />
            <span>
              I understand and agree that Sacred Light Symphony may translate my message into one or
              more additional languages for inclusion in the Book of Gratitude and related Sacred Light
              Symphony publications, while preserving the spirit and meaning of my original text.
              <span className={styles.req}> *</span>
            </span>
          </label>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className="sls-cta">
            Share My Gratitude
          </button>
          <p className={styles.submitNote}>
            Your expression of gratitude will create a new light within the Living Constellation. This
            usually takes a few days. Once alive, your light will receive its personal place and you
            will receive your personal URL.
          </p>
        </div>
      </form>
    </div>
  )
}

// ── Thank-you page (Funnel Page 4) ──────────────────────────────────────
function ThankYou({ copied, setCopied }: { copied: boolean; setCopied: (v: boolean) => void }) {
  const invite =
    'I just shared my light with the Sacred Light Symphony — a Book of Gratitude inspired by Tina Turner. Add yours:'
  const url = SITE_URL

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${invite} ${url}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  const shareInvitation = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Sacred Light Symphony', text: invite, url })
        return
      } catch {
        /* dismissed — fall through to copy */
      }
    }
    void copyLink()
  }

  const shares: { label: string; href?: string; onClick?: () => void }[] = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${invite} ${url}`)}` },
    {
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent('Share your light')}&body=${encodeURIComponent(`${invite} ${url}`)}`,
    },
    { label: 'Instagram', onClick: copyLink },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: copied ? 'Link copied ✓' : 'Copy link', onClick: copyLink },
  ]

  return (
    <div className={styles.funnel}>
      <header className={styles.stepHead}>
        <h1 className={styles.heading}>Thank You for Becoming a Messenger of Gratitude</h1>
        <p className={styles.lead}>Your message has been safely entrusted to the Book of Gratitude.</p>
      </header>

      <div className={styles.thanksBody}>
        <p>Something beautiful just happened.</p>
        <p>
          Your message of gratitude has become part of a growing journey shared by people from around
          the world.
        </p>
        <p>
          Every message entrusted to the Book becomes a light within the Living Constellation of Light
          — a living expression of gratitude, connecting hearts across continents, cultures and
          generations.
        </p>
        <p>
          Within the next few days, you will receive a personal email inviting you to discover your own
          light within the Living Constellation.
        </p>
        <p className={styles.thanksEm}>Until then… you are already part of something beautiful.</p>
        <p>
          The first Book of Gratitude is being lovingly curated and will remain gently held until its
          ceremonial unveiling on 26 November 2026, Tina Turner’s birthday, during the inaugural Sacred
          Light Symphony celebration beside Lake Zurich in Küsnacht, Switzerland. Following the
          celebration, every Messenger of Gratitude will receive a direct link to their message within
          the Book of Gratitude.
        </p>
      </div>

      <div className={styles.thanksClosing}>
        <p>Thank you for helping illuminate the world</p>
        <p>one message,</p>
        <p>one heart,</p>
        <p>one light at a time.</p>
      </div>

      <div className={styles.share}>
        <p className={styles.shareHeading}>Would you like to invite someone else to share their light?</p>
        <button type="button" className="sls-cta" onClick={shareInvitation}>
          Share the Invitation
        </button>
        <div className={`${styles.shareRow} ${styles.sharePlatforms}`}>
          {shares.map((s) =>
            s.href ? (
              <a
                key={s.label}
                className={styles.shareBtn}
                href={s.href}
                target="_blank"
                rel="noreferrer"
              >
                {s.label}
              </a>
            ) : (
              <button key={s.label} type="button" className={styles.shareBtn} onClick={s.onClick}>
                {s.label}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
