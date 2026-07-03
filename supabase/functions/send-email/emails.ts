// Branded HTML email templates for Sacred Light Symphony.
// Copy is verbatim from the Emails brief. Email-client-safe: table layout,
// inline styles, web-safe serif (Georgia) standing in for Playfair.

const SITE = 'https://sacredlightsymphony.org'
const FORM_URL = `${SITE}/gratitude`
const CONSTELLATION_URL = `${SITE}/#constellation` // Email 2 "Visit My Light" (interim)
const NEWSLETTER_URL = `${SITE}/gratitude#newsletter`

const C = {
  stone: '#eae4da',
  ivory: '#f4eee3',
  dark: '#0f0e0c',
  graphite: '#1b1815',
  graphiteSoft: 'rgba(27,24,21,0.72)',
  gold: '#b79a63',
  ivoryMute: 'rgba(244,238,227,0.55)',
}
const SERIF = "Georgia,'Times New Roman',serif"
const SANS = "Arial,Helvetica,sans-serif"

const h1 = (t: string) =>
  `<h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:normal;font-size:26px;line-height:1.25;color:${C.graphite};">${t}</h1>`
const h2 = (t: string) =>
  `<p style="margin:32px 0 10px;font-family:${SANS};font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${C.gold};">${t}</p>`
const p = (t: string) =>
  `<p style="margin:0 0 16px;font-family:${SERIF};font-size:16px;line-height:1.75;color:${C.graphiteSoft};">${t}</p>`
const stanza = (t: string) =>
  `<p style="margin:0 0 14px;font-family:${SERIF};font-style:italic;font-size:17px;line-height:1.5;color:${C.gold};text-align:center;">${t}</p>`
const rule = () =>
  `<div style="width:36px;height:1px;background:${C.gold};margin:28px auto;"></div>`

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 20px;"><tr><td align="center" style="border:1px solid ${C.gold};border-radius:999px;">` +
  `<a href="${href}" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${C.graphite};text-decoration:none;">${label}</a>` +
  `</td></tr></table>`

const socialRow = () =>
  `<p style="margin:20px 0 0;text-align:center;font-family:${SANS};font-size:12px;letter-spacing:0.06em;color:${C.gold};">` +
  [
    ['WhatsApp', `https://wa.me/?text=${encodeURIComponent('Share your light with the Book of Gratitude: ' + SITE)}`],
    ['Email', `mailto:?subject=${encodeURIComponent('Share your light')}&body=${encodeURIComponent(SITE)}`],
    ['Instagram', 'https://instagram.com'],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE)}`],
  ]
    .map(([l, h]) => `<a href="${h}" style="color:${C.gold};text-decoration:none;">${l}</a>`)
    .join(' &nbsp;·&nbsp; ') +
  `</p>`

const signoff = () =>
  p(`With love, joy and gratitude,<br><span style="color:${C.graphite};">The Sacred Light Symphony Team</span>`)

function layout(previewText: string, inner: string): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background:${C.stone};">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.stone};"><tr><td align="center" style="padding:32px 14px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.ivory};border:1px solid rgba(27,24,21,0.08);">` +
    `<tr><td align="center" style="padding:34px 32px 6px;"><div style="font-family:${SANS};font-size:13px;letter-spacing:0.26em;color:${C.gold};">SACRED&nbsp;·&nbsp;LIGHT&nbsp;·&nbsp;SYMPHONY</div></td></tr>` +
    `<tr><td style="padding:22px 40px 40px;">${inner}</td></tr>` +
    `<tr><td align="center" style="background:${C.dark};padding:26px 24px;">` +
    `<div style="font-family:${SANS};font-size:11px;letter-spacing:0.3em;color:${C.gold};">PRESENCE&nbsp;·&nbsp;LIGHT&nbsp;·&nbsp;RESONANCE</div>` +
    `<div style="font-family:${SANS};font-size:12px;color:${C.ivoryMute};margin-top:8px;">sacredlightsymphony.org</div>` +
    `</td></tr></table></td></tr></table></body></html>`
  )
}

type Rec = Record<string, unknown>
const first = (r: Rec) => String(r.first_name || r.name || 'Friend').split(' ')[0]

export function buildEmail(which: string, r: Rec): { subject: string; html: string } {
  const name = first(r)

  if (which === 'received') {
    const inner =
      h1('Your message of gratitude has arrived') +
      p(`Dear ${name},`) +
      p('Your message has arrived safely, and we are grateful you took this step. Congratulations on joining the Messengers of Light.') +
      p('We handle your message with care before it becomes part of the Book of Gratitude, our growing archive of human appreciation. Each expression of appreciation becomes a point of light.') +
      rule() +
      stanza('Each light represents one story,<br>one act of gratitude, one heart.') +
      stanza('Gradually, thousands of individual lights<br>become one Living Constellation.') +
      stanza('This Constellation is not made of stars.<br>It is made of hearts.') +
      rule() +
      p("Within the next days you will receive a personal email with your light's unique place within the Living Constellation of Light.") +
      p('While you wait, you are already part of this.') +
      h2('Help the Constellation Grow') +
      p('Every new message becomes another point of light. If Tina Turner touched the life of someone you love, perhaps this is the perfect moment to invite them to become a Messenger of Gratitude.') +
      button(FORM_URL, 'Share the Book of Gratitude') +
      h2('Stay Close to the Light') +
      p('Every two weeks, Sacred Light Symphony shares three newly selected messages from the Book of Gratitude, beautifully presented and quietly inspiring, along with news about the Living Constellation and Sacred Light Symphony’s unfolding.') +
      p('If you have not already subscribed, you are invited to join:') +
      button(NEWSLETTER_URL, 'Yes, I would like the newsletter') +
      p(`<span style="font-size:13px;">You may unsubscribe at any time. We will never share your details.</span>`) +
      socialRow() +
      rule() +
      signoff()
    return {
      subject: 'Your message of gratitude has arrived — Sacred Light Symphony',
      html: layout('Something beautiful just happened. Here is what comes next.', inner),
    }
  }

  if (which === 'approved') {
    const lightId = r.star_id != null ? String(r.star_id) : '—'
    const inner =
      h1('Your light now shines within the Living Constellation') +
      p(`Dear ${name},`) +
      p('We are delighted to share that your message of gratitude is now part of the Book of Gratitude.') +
      stanza('Your message has become a light.') +
      p('Within the Living Constellation of Light — our growing visual expression of collective gratitude — your contribution now shines as a unique point of light, joining hearts from around the world.') +
      h2('Your Light') +
      p(`Your Light Reference: <strong style="color:${C.graphite};">${lightId}</strong><br>Your personal link: <a href="${CONSTELLATION_URL}" style="color:${C.gold};">${CONSTELLATION_URL}</a>`) +
      p('This is your personal place within the Living Constellation. You are invited to keep this link and share it with family and friends.') +
      button(CONSTELLATION_URL, 'Visit My Light') +
      h2('What Happens Next') +
      p('Your message is now safely preserved within the Book of Gratitude, which is being lovingly curated for its ceremonial unveiling.') +
      p('On 26 November 2026 — Thanksgiving and Tina Turner’s birthday — the first edition of the Book of Gratitude will be ceremonially unveiled during the inaugural Sacred Light Symphony celebration beside Lake Zurich in Switzerland.') +
      p('Following the celebration, you will receive a personal invitation to discover your message within the interactive edition of the Book of Gratitude, alongside the lights entrusted by Messengers of Gratitude from around the world.') +
      h2('Pass the Light On') +
      p('Every new message becomes another point of light within the Living Constellation. If Tina Turner touched the life of someone you love, we would be honoured if you invited them to become a Messenger of Gratitude.') +
      stanza('Together, we are illuminating the world,<br>one message, one heart, one light at a time.') +
      button(FORM_URL, 'Invite a friend to become a Messenger') +
      rule() +
      signoff()
    return {
      subject: 'Your light now shines within the Living Constellation — Sacred Light Symphony',
      html: layout('Here is your place within the constellation.', inner),
    }
  }

  if (which === 'declined') {
    const inner =
      h1('A note about your submission') +
      p(`Dear ${name},`) +
      p('Thank you for taking the time to share your message of gratitude with Sacred Light Symphony.') +
      p('After giving it our kind attention, we find that your current submission is not quite ready for inclusion in the Book of Gratitude in its present form. This is a rare occurrence, and we want you to know that this is not a reflection of the value of your experience or your voice.') +
      p('The Book of Gratitude is a curated archive held to a specific standard of tone and integrity — one that honours the spirit of Tina Turner’s message and the community it is building.') +
      p('We would be genuinely honoured to receive a second message from you. You may wish to:') +
      p('• Share a different memory or expression of gratitude<br>• Revisit your original message from a place of love<br>• Write something entirely your own') +
      p('There are no rules about length, style, or subject. The only invitation is sincerity.') +
      button(FORM_URL, 'Share another message') +
      p(`If you have any questions or would like to speak with us directly, you are always welcome to write to us at <a href="mailto:sacredlightsymphony@protonmail.com" style="color:${C.gold};">sacredlightsymphony@protonmail.com</a>.`) +
      rule() +
      p(`With love and gratitude,<br><span style="color:${C.graphite};">The Sacred Light Symphony Team</span>`)
    return {
      subject: 'A note about your submission — Sacred Light Symphony',
      html: layout('Thank you for reaching out. We would love to hear from you again.', inner),
    }
  }

  // which === 'unveiling' (Email 4 — sent as a batch on 26 Nov 2026)
  const bookUrl = `${SITE}/book` // TODO: real personal Book page (Nov 26 interactive edition)
  const inner =
    h1('Today, the Book of Gratitude is unveiled') +
    p(`Dear ${name},`) +
    p('Earlier today in Küsnacht, Switzerland, beside Lake Zurich, the Mayor opened the physical Book of Gratitude at the first Sacred Light Symphony gathering. In that moment, every message held within it — including yours — became part of something lasting.') +
    p('We are honoured to share that the Book of Gratitude is now live. Every message, beautifully and carefully presented, is now visible for the world to read.') +
    h2('Your Message Is Inside') +
    p(`Your personal page: <a href="${bookUrl}" style="color:${C.gold};">${bookUrl}</a>`) +
    p('Visit your page. Read your words as they appear in the Book. Then explore the messages of thousands of others who chose, as you did, to make the light.') +
    button(bookUrl, 'Find my message in the Book of Gratitude') +
    h2('Your Light in the Living Constellation') +
    p('Your light continues to shine within the Living Constellation of Light. The constellation will keep growing, as Sacred Light Symphony continues its journey, year by year, heart by heart.') +
    p(`Your personal Light link: <a href="${CONSTELLATION_URL}" style="color:${C.gold};">${CONSTELLATION_URL}</a>`) +
    rule() +
    stanza('“When everything is so dark,<br>you have to find some way to make the light.”') +
    `<p style="margin:0 0 16px;text-align:center;font-family:${SANS};font-size:13px;letter-spacing:0.18em;color:${C.gold};">~ TINA TURNER</p>` +
    p('Thank you for being part of this.') +
    signoff()
  return {
    subject: 'The Book of Gratitude — your message is inside — Sacred Light Symphony',
    html: layout('Today is the day. Find your message. Find your Light.', inner),
  }
}
