import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  planTitle?: string
  stageLabel?: string
  stageStatus?: string
  due?: string
  progress?: number
  planUrl?: string
  sentBy?: string
  note?: string
}

const NAVY = '#0A2540'
const MUTED = '#5B6B7C'
const TEAL = '#0F9D9A'

/** One role player's copy of a workflow status notice: where the plan stands, what is due, and the link to open it. */
const WorkflowRoleNotice = ({ planTitle, stageLabel, stageStatus, due, progress, planUrl, sentBy, note }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{planTitle ? `EE workflow update: ${planTitle}` : 'EE workflow update'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, "Segoe UI", Arial, sans-serif' }}>
      <Container style={{ padding: '32px 25px', maxWidth: '560px' }}>
        <Heading style={{ color: NAVY, fontSize: '20px' }}>Employment Equity workflow update</Heading>
        <Text style={{ color: NAVY, fontSize: '14px', lineHeight: '22px' }}>
          You are a role player in the Employment Equity workflow{planTitle ? <> for <strong>{planTitle}</strong></> : null}.
        </Text>
        {stageLabel ? (
          <Text style={{ color: NAVY, fontSize: '14px', lineHeight: '22px' }}>
            Current stage: <strong>{stageLabel}</strong>{stageStatus ? <> — {stageStatus}.</> : '.'}
          </Text>
        ) : (
          <Text style={{ color: NAVY, fontSize: '14px', lineHeight: '22px' }}>The workflow has not been started yet.</Text>
        )}
        {due ? <Text style={{ color: NAVY, fontSize: '14px', lineHeight: '22px' }}>Due: {due}</Text> : null}
        {typeof progress === 'number' ? <Text style={{ color: MUTED, fontSize: '13px', lineHeight: '20px' }}>{progress}% of the workflow is complete.</Text> : null}
        {note ? <Text style={{ color: NAVY, fontSize: '14px', lineHeight: '22px', fontStyle: 'italic' }}>{note}</Text> : null}
        {sentBy ? <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '18px' }}>Sent by {sentBy}.</Text> : null}
        {planUrl ? (
          <Button href={planUrl} style={{ backgroundColor: TEAL, color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '14px' }}>
            Open the EE plan
          </Button>
        ) : null}
        <Hr style={{ borderColor: '#E3E8EF', marginTop: '28px' }} />
        <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '18px' }}>DDHS Equity Intelligence · You own your data. DDHS operates the platform.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WorkflowRoleNotice,
  subject: (d: Record<string, any>) => `EE workflow: ${d['stageLabel'] ?? 'status update'}`,
  displayName: 'Workflow role player notice',
  previewData: {
    planTitle: 'EE Plan 2027-2031',
    stageLabel: 'Stage 5: Consultation and plan approval',
    stageStatus: 'in progress',
    due: '2027-01-15',
    progress: 29,
    planUrl: 'https://ddhs-equity-intelligence.lovable.app/plans',
    sentBy: 'sdm@ddhs.co.za',
    note: 'Please review the draft before the committee meets.',
  },
} satisfies TemplateEntry
