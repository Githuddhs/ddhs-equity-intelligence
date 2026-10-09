import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

type Item = { title: string; ref: string; due: string; days: number; note: string }
interface Props { items?: Item[]; dashboardUrl?: string }

const sample: Item[] = [
  { title: 'EEA2 & EEA4 annual reports (online)', ref: 's21, s27', due: '15 January 2027', days: 30, note: 'Submit online by 15 January.' },
]

function ComplianceReminder({ items = sample, dashboardUrl = 'https://ddhs.co.za/compliance' }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${items.length} Employment Equity deadline(s) coming up`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', padding: '28px 24px' }}>
          <Text style={{ color: '#00A3A3', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>DDHS EQUITY INTELLIGENCE</Text>
          <Heading style={{ color: '#0A2540', fontSize: '22px', margin: '8px 0 16px' }}>Upcoming Employment Equity deadlines</Heading>
          {items.map((i) => (
            <Section key={i.title} style={{ border: '1px solid #E3E8EE', borderRadius: '10px', padding: '12px 16px', marginBottom: '10px' }}>
              <Text style={{ color: '#0A2540', fontSize: '15px', fontWeight: 700, margin: 0 }}>{i.title} <span style={{ color: '#5B6B7C', fontWeight: 400, fontSize: '12px' }}>({i.ref})</span></Text>
              <Text style={{ color: i.days <= 7 ? '#C0392B' : '#0A2540', fontSize: '13px', margin: '4px 0' }}>
                Due {i.due} — {i.days <= 0 ? 'today' : `${i.days} day${i.days === 1 ? '' : 's'} left`}
              </Text>
              <Text style={{ color: '#5B6B7C', fontSize: '12px', margin: 0 }}>{i.note}</Text>
            </Section>
          ))}
          <Button href={dashboardUrl} style={{ backgroundColor: '#0A2540', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, marginTop: '12px' }}>
            Open compliance dashboard
          </Button>
          <Hr style={{ borderColor: '#E3E8EE', margin: '24px 0 12px' }} />
          <Text style={{ color: '#5B6B7C', fontSize: '11px' }}>You receive this because reminders are switched on in your DDHS Compliance dashboard. Change reminder timing there.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ComplianceReminder,
  subject: (d: Record<string, any>) => {
    const items = (d['items'] ?? []) as Item[]
    const first = items[0]
    return first ? `EE reminder: ${first.title} due in ${first.days} day${first.days === 1 ? '' : 's'}` : 'Employment Equity deadline reminder'
  },
  displayName: 'Compliance deadline reminder',
  previewData: { items: sample },
} satisfies TemplateEntry
