import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import TopBanner from '../../components/TopBanner/TopBanner'
import Seo from '../../components/Seo/Seo'
import {
  enter,
  resume,
  leave,
  confirmDetails,
  getGuide,
  checkFile,
  uploadContribution,
  sendGratitudeMessage,
  homageMessage,
  mediaTypeOf,
  HomageError,
  HOMAGE_PREVIEW,
  AUDIO_EXT,
  VIDEO_EXT,
  MAX_GRATITUDE_MESSAGE,
  MAX_NOTE_SECONDS,
  type GuideTrack,
  type HomageState,
  type MediaType,
  type UploadKind,
} from '../../lib/homage'
import styles from './Homage.module.css'

const CONTACT = 'alliances@sacredlightsymphony.org'
const MB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** Returns true when the error was an expired session (and has been handled). */
type OnExpire = (e: unknown) => boolean

/**
 * The Homage Portal — a private, invitation-only page (never linked, never
 * indexed) where invited artists sign a release, collect the guide track and
 * upload a contribution to the Global Moment of Humming, with an optional note
 * for the Living Book of Gratitude. Flow per the 2 Oct 2026 Developer Brief.
 *
 * SKELETON: the e-signature step is a placeholder, and the privacy notice and
 * page copy are drafts awaiting the client's wording. Every lock shown here is
 * enforced by the `homage` Edge Function, not by this page.
 */
export default function Homage() {
  const [state, setState] = useState<HomageState | null>(null)
  const [notice, setNotice] = useState('')

  // Pick the session back up after a refresh (the token lives in this tab only).
  useEffect(() => {
    let alive = true
    void resume().then((s) => {
      if (alive && s) setState(s)
    })
    return () => {
      alive = false
    }
  }, [])

  const onExpire: OnExpire = (e) => {
    if (!(e instanceof HomageError) || e.code !== 'session_expired') return false
    setState(null)
    setNotice(homageMessage(e))
    return true
  }

  return (
    <main className={styles.page}>
      <Seo
        title="By Invitation — Sacred Light Symphony"
        description="A private page of Sacred Light Symphony."
        path="/homage"
        noindex
      />
      <TopBanner />

      <div className={styles.wrap}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>By personal invitation</p>
          <h1 className={styles.heading}>The Homage Portal</h1>
          <p className={styles.lead}>
            Your contribution to the Global Moment of Humming — 26 November 2026, 20:00 Zurich time.
          </p>
        </header>

        {state ? (
          <Portal
            state={state}
            onState={setState}
            onExpire={onExpire}
            onLeave={() => {
              leave()
              setNotice('')
              setState(null)
            }}
          />
        ) : (
          <Gate notice={notice} onEnter={setState} />
        )}
      </div>
    </main>
  )
}

// ── Entry — privacy notice, then the shared-password gate ───────────────────
function Gate({ notice, onEnter }: { notice: string; onEnter: (s: HomageState) => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onEnter(await enter(password))
    } catch (err) {
      setError(homageMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* The notice sits BEFORE the password field: it must be read before any
          personal data is collected (brief — Entry & Security). */}
      <section className={styles.privacy} aria-labelledby="privacy-title">
        <h2 id="privacy-title" className={styles.privacyTitle}>
          Before you enter — your privacy
        </h2>
        {/* DRAFT wording — to be replaced with the client's reviewed notice. */}
        <dl className={styles.privacyList}>
          <dt>What we collect</dt>
          <dd>
            Your name and contact email, your signed release, the audio or video recording you
            choose to upload, and any message you leave for the Living Book of Gratitude.
          </dd>
          <dt>Why</dt>
          <dd>
            To include your contribution in the Global Moment of Humming and, if you wish, in the
            Living Book of Gratitude — and for nothing else.
          </dd>
          <dt>How long it is kept</dt>
          <dd>[Retention period to be confirmed.] You may ask for your contribution to be deleted at any time.</dd>
          <dt>Questions</dt>
          <dd>
            <a className={styles.link} href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
          </dd>
        </dl>
      </section>

      <form className={styles.gate} onSubmit={submit}>
        <label htmlFor="homage-password" className={styles.label}>
          Password from your invitation
        </label>
        <input
          id="homage-password"
          className={styles.input}
          type="password"
          autoComplete="off"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {(error || notice) && (
          <p className={styles.error} role="alert">
            {error || notice}
          </p>
        )}
        <div className={styles.actions}>
          <button type="submit" className="sls-cta" disabled={busy}>
            {busy ? 'One moment…' : 'Enter'}
          </button>
        </div>
        {HOMAGE_PREVIEW && (
          <p className={styles.hint}>Local preview — no backend connected, so any password opens the page.</p>
        )}
      </form>
    </>
  )
}

// ── Inside the gate — the four steps, then the optional Living Book ─────────
function Portal({
  state,
  onState,
  onExpire,
  onLeave,
}: {
  state: HomageState
  onState: (s: HomageState) => void
  onExpire: OnExpire
  onLeave: () => void
}) {
  // The stored name of the file just received, for the confirmation step.
  const [received, setReceived] = useState<string | null>(null)
  const confirmRef = useRef<HTMLDivElement>(null)

  const released = state.release === 'completed' || (state.signingMode === 'stub' && state.release === 'stub')
  const confirmed = Boolean(received) || state.submitted

  useEffect(() => {
    if (received) confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [received])

  return (
    <>
      {state.signingMode === 'stub' && (
        <p className={styles.previewStrip} role="note">
          Preview build — the electronic signature is not yet connected. Not for use with invitees.
        </p>
      )}

      <Step n={1} title="The Talent & Media Release" done={released}>
        <ReleaseStep state={state} released={released} onState={onState} onExpire={onExpire} />
      </Step>

      <Step n={2} title="The Guide Track" locked={!released}>
        <GuideStep unlocked={released} onExpire={onExpire} />
      </Step>

      <Step n={3} title="Your Contribution" locked={!released}>
        <UploadStep
          state={state}
          onExpire={onExpire}
          onDone={(fileName, next) => {
            onState(next)
            setReceived(fileName)
          }}
        />
      </Step>

      <div ref={confirmRef}>
        <Step n={4} title="Confirmation" locked={!confirmed} done={confirmed}>
          {confirmed ? (
            <div className={styles.thanks}>
              <p className={styles.thanksLead}>Thank you. Your contribution has arrived safely.</p>
              {received && (
                <p>
                  Received as <strong className={styles.strong}>{received}</strong>.
                </p>
              )}
              <p>
                There is nothing more you need to do, and no need to follow up — it is now in the care
                of the Sacred Light Symphony team.
              </p>
            </div>
          ) : (
            <p className={styles.body}>Once your upload is complete, its receipt is confirmed here.</p>
          )}
        </Step>
      </div>

      <LivingBook state={state} onExpire={onExpire} />

      <p className={styles.leave}>
        <button type="button" className={styles.textBtn} onClick={onLeave}>
          Leave the portal
        </button>
      </p>
    </>
  )
}

/** One numbered step. A locked step is greyed out and cannot be interacted with. */
function Step({
  n,
  title,
  locked = false,
  done = false,
  children,
}: {
  n: number
  title: string
  locked?: boolean
  done?: boolean
  children: ReactNode
}) {
  return (
    <section className={`${styles.step} ${locked ? styles.locked : ''}`} inert={locked} aria-labelledby={`step-${n}`}>
      <p className={styles.stepNum}>
        Step {n}
        {locked && <span className={styles.stepState}> · Locked</span>}
        {done && <span className={styles.stepState}> · Complete</span>}
      </p>
      <h2 id={`step-${n}`} className={styles.stepTitle}>
        {title}
      </h2>
      {children}
    </section>
  )
}

// ── Step 1 — the release. PLACEHOLDER until an e-signature provider is chosen:
// it collects who is contributing (which names the uploaded file) and unlocks
// the steps below, but it is not a signature and records no release.
function ReleaseStep({
  state,
  released,
  onState,
  onExpire,
}: {
  state: HomageState
  released: boolean
  onState: (s: HomageState) => void
  onExpire: OnExpire
}) {
  const [signerName, setSignerName] = useState('')
  const [artistName, setArtistName] = useState('')
  const [email, setEmail] = useState('')
  const [onBehalfOf, setOnBehalfOf] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (released) {
    return (
      <p className={styles.body}>
        Details received for <strong className={styles.strong}>{state.artistName}</strong>. The steps
        below are now open.
      </p>
    )
  }

  if (state.signingMode !== 'stub') {
    // The embedded signing frame mounts here once a provider is connected.
    return <p className={styles.body}>The release will open here for your signature.</p>
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!signerName.trim() || !artistName.trim() || !isEmail(email.trim()) || !agreed) {
      setError('Please complete the required fields.')
      return
    }
    setBusy(true)
    setError('')
    try {
      onState(await confirmDetails({ signerName, artistName, email, onBehalfOf, agreed }))
    } catch (err) {
      if (!onExpire(err)) setError(homageMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className={styles.body}>
        The Talent & Media Release will be presented here for electronic signature. Until that is
        connected, please confirm who is contributing so the steps below can open.
      </p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="signerName" className={styles.label}>
            Your full name <span className={styles.req}>*</span>
          </label>
          <input
            id="signerName"
            className={styles.input}
            type="text"
            autoComplete="name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email <span className={styles.req}>*</span>
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="artistName" className={styles.label}>
          Artist or public name <span className={styles.req}>*</span>
        </label>
        <input
          id="artistName"
          className={styles.input}
          type="text"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
        />
        <p className={styles.hint}>The name this contribution is made under.</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="onBehalfOf" className={styles.label}>
          Your role or organisation <span className={styles.optional}>(if you are completing this for the artist)</span>
        </label>
        <input
          id="onBehalfOf"
          className={styles.input}
          type="text"
          autoComplete="organization"
          value={onBehalfOf}
          onChange={(e) => setOnBehalfOf(e.target.value)}
        />
      </div>

      <label className={styles.check}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          I confirm these details are correct and that I am authorised to make this contribution.
          <span className={styles.req}> *</span>
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="submit" className="sls-cta" disabled={busy}>
          {busy ? 'One moment…' : 'Continue'}
        </button>
      </div>
    </form>
  )
}

// ── Step 2 — stream the guide track, download the click-track package ───────
function GuideStep({ unlocked, onExpire }: { unlocked: boolean; onExpire: OnExpire }) {
  const [guide, setGuide] = useState<GuideTrack | null>(null)

  // The links are only issued once the release is done — fetch them on unlock.
  useEffect(() => {
    if (!unlocked) return
    let alive = true
    getGuide()
      .then((g) => {
        if (alive) setGuide(g)
      })
      .catch((e) => {
        if (alive && !onExpire(e)) setGuide({ stream: null, download: null })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked])

  return (
    <>
      <p className={styles.body}>
        Listen to the guide track here, or download the full click-track package (metronome and
        harmonic guide) for your engineer.
      </p>

      {guide?.stream ? (
        <audio className={styles.player} controls preload="none" src={guide.stream.url} />
      ) : (
        <p className={styles.placeholder}>
          {unlocked && guide ? 'The guide track will be available here shortly.' : 'The guide track plays here.'}
        </p>
      )}

      {guide?.download && (
        <p className={styles.downloadRow}>
          <a className="sls-cta" href={guide.download.url} download={guide.download.name}>
            Download the click-track package
          </a>
        </p>
      )}

      <ul className={styles.specs}>
        <li>
          <strong className={styles.strong}>Audio — WAV or AIFF, 24-bit / 48 kHz preferred.</strong>
        </li>
        <li>
          <strong className={styles.strong}>Video — MP4 or MOV, 1080p or 4K, landscape.</strong>
        </li>
      </ul>
    </>
  )
}

// ── Step 3 — audio or video, then the direct-to-storage upload ──────────────
function UploadStep({
  state,
  onExpire,
  onDone,
}: {
  state: HomageState
  onExpire: OnExpire
  onDone: (fileName: string, next: HomageState) => void
}) {
  const [mediaType, setMediaType] = useState<MediaType | null>(null)

  return (
    <>
      <fieldset className={styles.choice}>
        <legend className={styles.label}>What are you submitting?</legend>
        <label className={styles.check}>
          <input type="radio" name="mediaType" checked={mediaType === 'audio'} onChange={() => setMediaType('audio')} />
          <span>I am submitting Audio Only</span>
        </label>
        <label className={styles.check}>
          <input type="radio" name="mediaType" checked={mediaType === 'video'} onChange={() => setMediaType('video')} />
          <span>I am submitting Video + Audio</span>
        </label>
      </fieldset>

      {mediaType ? (
        // Keyed so switching audio ↔ video clears a file chosen for the other.
        <Uploader
          key={mediaType}
          kind="humming"
          mediaType={mediaType}
          maxMb={state.maxUploadMb}
          cta="Upload my contribution"
          onExpire={onExpire}
          onDone={onDone}
        />
      ) : (
        <p className={styles.placeholder}>Choose one of the options above to open the upload.</p>
      )}

      {state.submitted && (
        <p className={styles.hint}>A contribution has already been received. You may send another file if needed.</p>
      )}
    </>
  )
}

/** File picker + progress bar for one direct-to-storage upload. */
function Uploader({
  kind,
  mediaType,
  name,
  email,
  maxMb,
  maxSeconds,
  cta,
  disabled = false,
  onExpire,
  onDone,
}: {
  kind: UploadKind
  /** Fixed type for the humming upload; left open for a Living Book note. */
  mediaType?: MediaType
  name?: string
  email?: string
  maxMb: number
  maxSeconds?: number
  cta: string
  disabled?: boolean
  onExpire: OnExpire
  onDone: (fileName: string, next: HomageState) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  const exts = mediaType === 'audio' ? AUDIO_EXT : mediaType === 'video' ? VIDEO_EXT : [...AUDIO_EXT, ...VIDEO_EXT]
  const sending = progress !== null
  const percent = Math.round((progress ?? 0) * 100)

  const choose = async (f: File | null) => {
    if (!f || sending) return
    try {
      await checkFile(f, { mediaType, maxMb, maxSeconds })
      setError('')
      setFile(f)
    } catch (e) {
      setFile(null)
      setError(homageMessage(e, maxMb))
    }
  }

  const send = async () => {
    const type = file && (mediaType ?? mediaTypeOf(file.name))
    if (!file || !type) return
    setError('')
    setProgress(0)
    try {
      const done = await uploadContribution({ kind, mediaType: type, file, name, email }, setProgress)
      setFile(null)
      onDone(done.fileName, done.state)
    } catch (e) {
      if (!onExpire(e)) setError(homageMessage(e, maxMb))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className={styles.uploader}>
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
          void choose(e.dataTransfer.files?.[0] ?? null)
        }}
      >
        {file ? (
          <span className={styles.fileName}>
            {file.name} · {MB(file.size)}
          </span>
        ) : (
          <>
            <span className={styles.dropText}>Tap to choose, or drag a file here</span>
            <span className={styles.dropSub}>
              {exts.map((x) => x.toUpperCase()).join(', ')} · up to {maxMb} MB
              {maxSeconds ? ` · ${maxSeconds} seconds at most` : ''}
            </span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={exts.map((x) => `.${x}`).join(',')}
        hidden
        onChange={(e) => {
          void choose(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />

      {sending && (
        <div className={styles.progress}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className={styles.progressFill} style={{ width: `${percent}%` }} />
          </div>
          <p className={styles.progressText}>Uploading… {percent}% — please keep this page open.</p>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className="sls-cta" disabled={!file || sending || disabled} onClick={send}>
          {sending ? 'Uploading…' : cta}
        </button>
      </div>
    </div>
  )
}

// ── Optional — the Living Book of Gratitude ─────────────────────────────────
// A second, lighter invitation: entirely voluntary, and independent of whether
// a humming contribution was sent (so it is never locked behind the steps).
function LivingBook({ state, onExpire }: { state: HomageState; onExpire: OnExpire }) {
  const [name, setName] = useState(state.artistName ?? '')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<'message' | 'note' | null>(null)

  // Step 1 may be completed after this section first rendered — follow the name.
  useEffect(() => {
    if (state.artistName) setName((current) => current || state.artistName || '')
  }, [state.artistName])

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      setError('Please add your name and a message.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await sendGratitudeMessage({ name, email, message })
      setMessage('')
      setSent('message')
    } catch (err) {
      if (!onExpire(err)) setError(homageMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.book} aria-labelledby="book-title">
      <p className={styles.eyebrow}>Optional — entirely voluntary</p>
      <h2 id="book-title" className={styles.bookTitle}>
        The Living Book of Gratitude
      </h2>
      <p className={styles.body}>
        A physical and digital Living Book of Gratitude will be opened in a lakeside ceremony on the
        evening of 26 November 2026. If you would like to leave a few words in it, you are warmly
        invited to — whether or not you send a humming contribution above.
      </p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="bookName" className={styles.label}>
            Your name, as it should appear
          </label>
          <input id="bookName" className={styles.input} type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="bookEmail" className={styles.label}>
            Email <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="bookEmail"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={sendMessage} noValidate>
        <h3 className={styles.optionTitle}>A written message</h3>
        <p className={styles.hint}>To be printed into the physical book.</p>
        <textarea
          className={styles.textarea}
          aria-label="Your written message"
          maxLength={MAX_GRATITUDE_MESSAGE}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className={styles.counter}>
          {message.length} / {MAX_GRATITUDE_MESSAGE}
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {sent === 'message' && <p className={styles.sent}>Thank you — your message has been received.</p>}
        <div className={styles.actions}>
          <button type="submit" className="sls-cta" disabled={busy}>
            {busy ? 'One moment…' : 'Send my message'}
          </button>
        </div>
      </form>

      <div className={styles.or} aria-hidden="true">
        or
      </div>

      <h3 className={styles.optionTitle}>A short recorded note</h3>
      <p className={styles.hint}>Audio or video, {MAX_NOTE_SECONDS} seconds at most.</p>
      <Uploader
        kind="gratitude"
        name={name.trim()}
        email={email.trim()}
        maxMb={state.maxUploadMb}
        maxSeconds={MAX_NOTE_SECONDS}
        cta="Send my recorded note"
        disabled={!name.trim()}
        onExpire={onExpire}
        onDone={() => setSent('note')}
      />
      {!name.trim() && <p className={styles.hint}>Please add your name above before sending a note.</p>}
      {sent === 'note' && <p className={styles.sent}>Thank you — your note has been received.</p>}
    </section>
  )
}
