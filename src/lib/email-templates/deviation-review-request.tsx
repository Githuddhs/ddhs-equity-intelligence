import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { stepLabel?: string; vacancyTitle?: string; rating?: string; requestUrl?: string; daysWaiting?: number }

const DeviationReviewRequest = ({ stepLabel, vacancyTitle, rating, requestUrl, daysWaiting }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A deviation request is waiting for your review</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, "Segoe UI", Arial, sans-serif' }}>
      <Container style={{ padding: '32px 25px', maxWidth: '560px' }}>
        <Heading style={{ color: '#0A2540', fontSize: '20px' }}>{daysWaiting ? 'Reminder: your review is still needed' : 'Your review is needed'}</Heading>
        {daysWaiting ? <Text style={{ color: '#0A2540', fontSize: '14px', lineHeight: '22px' }}>This request has been waiting for your decision for {daysWaiting} day{daysWaiting === 1 ? '' : 's'}.</Text> : null}
        <Text style={{ color: '#0A2540', fontSize: '14px', lineHeight: '22px' }}>
          An EE deviation request{vacancyTitle ? ` for the vacancy "${vacancyTitle}"` : ''} has reached your step
          {stepLabel ? ` as ${stepLabel}` : ''}{rating ? ` (rating: ${rating})` : ''}. Every earlier reviewer has recorded their decision.
        </Text>
        <Text style={{ color: '#5B6B7C', fontSize: '13px', lineHeight: '20px' }}>
          For confidentiality, candidate details are not included in this email. Sign in to review the reason, evidence and approval route.
        </Text>
        {requestUrl ? (
          <Button href={requestUrl} style={{ backgroundColor: '#0F9D9A', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '14px' }}>
            Open the deviation request
          </Button>
        ) : null}
        <Text style={{ color: '#5B6B7C', fontSize: '12px', marginTop: '24px' }}>DDHS Equity Intelligence</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DeviationReviewRequest,
  subject: (d: Record<string, any>) => `${d['daysWaiting'] ? 'Reminder: d' : 'D'}eviation request awaiting your review${d['stepLabel'] ? ` (${d['stepLabel']})` : ''}`,
  displayName: 'Deviation review request',
  previewData: { stepLabel: 'HR business partner', vacancyTitle: 'Senior Lecturer', rating: 'Amber', requestUrl: 'https://ddhs-equity-intelligence.lovable.app/deviations' },
} satisfies TemplateEntry
