import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { orgName?: string; reference?: string; responseUrl?: string }

const ExitInterviewSubmitted = ({ orgName, reference, responseUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>An exit interview has been submitted</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, "Segoe UI", Arial, sans-serif' }}>
      <Container style={{ padding: '32px 25px', maxWidth: '560px' }}>
        <Heading style={{ color: '#0A2540', fontSize: '20px' }}>Exit interview submitted</Heading>
        <Text style={{ color: '#0A2540', fontSize: '14px', lineHeight: '22px' }}>
          A departing employee has completed the confidential exit interview
          {reference ? ` for link ${reference}` : ''}{orgName ? ` (${orgName})` : ''}.
        </Text>
        <Text style={{ color: '#5B6B7C', fontSize: '13px', lineHeight: '20px' }}>
          For confidentiality, answers are not included in this email. Sign in and open this client's workspace to view the response under Workforce Data.
        </Text>
        {responseUrl ? (
          <Button href={responseUrl} style={{ backgroundColor: '#0F9D9A', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '14px' }}>
            Open client workspace
          </Button>
        ) : null}
        <Text style={{ color: '#8A97A5', fontSize: '12px', marginTop: '24px' }}>DDHS Equity Intelligence</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ExitInterviewSubmitted,
  subject: 'Exit interview submitted',
  displayName: 'Exit interview submitted (staff)',
  previewData: { orgName: 'Example Holdings', reference: 'EXIT-001', responseUrl: 'https://ddhs-equity-intelligence.lovable.app/clients/example' },
} satisfies TemplateEntry
