import { useRef, useState, type FormEvent } from 'react'
import {
  submitContribution,
  isValidEmail,
  ALLOWED_FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_MESSAGE,
} from '../../lib/contributions'
import styles from './GratitudeForm.module.css'

type Status = 'idle' | 'submitting' | 'success'

/**
 * Share Your Light — the Book of Gratitude contribution form.
 * All copy is from the Share-Your-Light reference document. Styled in the
 * charcoal "gallery" register so it continues from Section 2.
 */
export default function GratitudeForm() {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [savedPreview, setSavedPreview] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const chooseFile = (f: File | null) => {
    if (!f) return
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      setError('Please choose a JPG, PNG, or PDF.')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(`${f.name} is larger than 10 MB.`)
      return
    }
    setError('')
    setFile(f)
  }

  const validate = (): string => {
    if (!message.trim() || !name.trim() || !email.trim()) {
      return 'Please complete the required fields.'
    }
    if (!isValidEmail(email.trim())) {
      return 'Please enter a valid email address.'
    }
    if (file && file.size > MAX_FILE_BYTES) {
      return `${file.name} is larger than 10 MB.`
    }
    if (!consent) {
      return 'Please confirm consent to be included.'
    }
    return ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError('')
    setStatus('submitting')
    const result = await submitContribution({
      message: message.trim(),
      name: name.trim(),
      email: email.trim(),
      location: location.trim() || undefined,
      file,
    })
    if (result.ok) {
      setSavedPreview(result.preview)
      setStatus('success')
    } else {
      setStatus('idle')
      setError(result.error)
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.success} role="status">
        <p className={styles.successHeading}>Your light matters.</p>
        {/* Live confirmation copy is a placeholder pending Marie's approved wording. */}
        <p className={styles.successNote}>
          {savedPreview
            ? 'Submission saved locally for preview (backend not yet connected).'
            : 'Thank you — your message has been received.'}
        </p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {/* Message */}
      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>
          Your message of gratitude <span className={styles.req}>*</span>
        </label>
        <textarea
          id="message"
          className={styles.textarea}
          placeholder="What are you grateful for? Whose light awakened yours?"
          maxLength={MAX_MESSAGE}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.counter}>
          {message.length} / {MAX_MESSAGE}
        </div>
      </div>

      {/* Name */}
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          Your name <span className={styles.req}>*</span>
        </label>
        <input
          id="name"
          className={styles.input}
          type="text"
          placeholder="The name to appear with your message"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className={styles.hint}>This is how you’ll be credited in the Book of Gratitude.</p>
      </div>

      {/* Email */}
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

      {/* Location */}
      <div className={styles.field}>
        <label htmlFor="location" className={styles.label}>
          Where in the world are you?
        </label>
        <input
          id="location"
          className={styles.input}
          type="text"
          placeholder="City, country (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* File upload */}
      <div className={styles.field}>
        <span className={styles.label}>Add a photo, signature, or artwork</span>
        <div
          className={`${styles.drop} ${dragging ? styles.dropActive : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
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
            chooseFile(e.dataTransfer.files?.[0] ?? null)
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
                  setFile(null)
                }}
              >
                remove
              </button>
            </span>
          ) : (
            <>
              <span className={styles.dropText}>Tap to choose, or drag a file here</span>
              <span className={styles.dropSub}>Images up to 10 MB — JPG, PNG, or PDF</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          hidden
          onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Consent */}
      <div className={styles.field}>
        <label className={styles.consent}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I’m happy for my message and name to be included in the Book of Gratitude, and I
            understand my light will join the living constellation. <span className={styles.req}>*</span>
          </span>
        </label>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className="sls-cta" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Releasing your light…' : 'Release my light'}
        </button>
      </div>
    </form>
  )
}
