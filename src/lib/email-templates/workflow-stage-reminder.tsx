import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { planTitle?: string; stageLabel?: string; kind?: 'upcoming' | 'overdue'; due?: string; days?: number; planUrl?: string }

const WorkflowStageReminder = ({ planTitle, stageLabel, kind, due, days, planUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{kind === 'overdue' ? 'An EE workflow stage is overdue' : 'An EE workflow stage is due soon'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, "Segoe UI", Arial, sans-serif' }}>
      <Container style={{ padding: '32px 25px', maxWidth: '560px' }}>
        <Heading style={{ color: '#0A2540', fontSize: '20px' }}>{kind === 'overdue' ? 'Workflow stage overdue' : 'Workflow stage due soon'}</Heading>
        <Text style={{ color: '#0A2540', fontSize: '14px', lineHeight: '22px' }}>
          {stageLabel ? `"${stageLabel}"` : 'A stage'}{planTitle ? ` on the EE plan "${planTitle}"` : ''}{' '}
          {kind === 'overdue' ? `was due on ${due ?? ''} and is ${days ?? 0} day${days === 1 ? '' : 's'} overdue.` : `is due on ${due ?? ''}${days ? `, in ${days} day${days === 1 ? '' : 's'}` : ', today'}.`}
        </Text>
        {planUrl ? <Button href={planUrl} style={{ backgroundColor: '#0F9D9A', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '14px' }}>Open the EE plan</Button> : null}
        <Text style={{ color: '#5B6B7C', fontSize: '12px', marginTop: '24px' }}>DDHS Equity Intelligence</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WorkflowStageReminder,
  subject: (d: Record<string, any>) => `${d['kind'] === 'overdue' ? 'Overdue' : 'Due soon'}: ${d['stageLabel'] ?? 'EE workflow stage'}`,
  displayName: 'Workflow stage reminder',
  previewData: { planTitle: 'EE Plan 2027-2031', stageLabel: 'EE Committee consultation', kind: 'upcoming', due: '2027-01-10', days: 5, planUrl: 'https://ddhs-equity-intelligence.lovable.app/plans' },
} satisfies TemplateEntry
