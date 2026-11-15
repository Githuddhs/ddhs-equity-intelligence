import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { orgName?: string; surveyTitle?: string; surveyUrl?: string; expiryDate?: string }

const InclusionPulseInvitation = ({ orgName, surveyTitle, surveyUrl, expiryDate }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your confidential inclusion and belonging pulse survey is ready</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, "Segoe UI", Arial, sans-serif' }}>
      <Container style={{ padding: '32px 25px', maxWidth: '560px' }}>
        <Heading style={{ color: '#0A2540', fontSize: '20px' }}>{surveyTitle || 'Inclusion & belonging pulse'}</Heading>
        <Text style={{ color: '#0A2540', fontSize: '14px', lineHeight: '22px' }}>
          {orgName || 'Your organisation'} has invited you to complete a confidential inclusion and belonging pulse survey.
        </Text>
        <Text style={{ color: '#5B6B7C', fontSize: '13px', lineHeight: '20px' }}>
          Your individual answers are restricted to authorised DDHS staff with permission. Your organisation receives aggregate results only after at least three people have responded. No name or written comments are requested.
        </Text>
        {surveyUrl ? (
          <Button href={surveyUrl} style={{ backgroundColor: '#0F9D9A', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '14px' }}>
            Complete the confidential survey
          </Button>
        ) : null}
        <Text style={{ color: '#5B6B7C', fontSize: '13px', lineHeight: '20px' }}>
          This private link can be used once{expiryDate ? ` and closes on ${expiryDate}` : ''}. Please do not forward it to anyone else.
        </Text>
        <Text style={{ color: '#8A97A5', fontSize: '12px', marginTop: '24px' }}>DDHS Equity Intelligence</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InclusionPulseInvitation,
  subject: (data: Record<string, any>) => `${data['orgName'] || 'DDHS'}: confidential inclusion & belonging pulse`,
  displayName: 'Inclusion pulse invitation (employee)',
  previewData: { orgName: 'Example Holdings', surveyTitle: 'Inclusion & belonging pulse', surveyUrl: 'https://ddhs-equity-intelligence.lovable.app/inclusion-pulse/example', expiryDate: '30 November 2026' },
} satisfies TemplateEntry
