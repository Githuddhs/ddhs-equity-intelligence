import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import type { TemplateEntry } from './registry'

interface EnquiryNotificationProps {
  fullName?: string
  email?: string
  company?: string
  jobTitle?: string
  phone?: string
  workforceSize?: string
  message?: string
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <tr>
      <td
        style={{
          padding: '6px 12px 6px 0',
          color: '#5B6B7C',
          fontSize: '13px',
          verticalAlign: 'top',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </td>
      <td style={{ padding: '6px 0', color: '#0A2540', fontSize: '13px' }}>{value}</td>
    </tr>
  )
}

function EnquiryNotification({
  fullName = 'Jane Doe',
  email = 'jane@example.co.za',
  company = 'Example Holdings',
  jobTitle = 'HR Director',
  phone = '',
  workforceSize = '200 – 499 employees',
  message = 'We need help preparing our EEA2 and EEA4 submissions before the deadline.',
}: EnquiryNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New website enquiry from ${fullName} at ${company}`}</Preview>
      <Body style={{ backgroundColor: '#F4F6F8', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container
          style={{
            backgroundColor: '#FFFFFF',
            margin: '24px auto',
            padding: '32px',
            maxWidth: '560px',
            borderRadius: '8px',
          }}
        >
          <Heading
            as="h1"
            style={{ color: '#0A2540', fontSize: '20px', margin: '0 0 4px' }}
          >
            New enquiry from the DDHS Equity Intelligence website
          </Heading>
          <Text style={{ color: '#5B6B7C', fontSize: '13px', margin: '0 0 20px' }}>
            Submitted through the contact form on ddhs.co.za
          </Text>

          <Section>
            <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
              <tbody>
                <Row label="Name" value={fullName} />
                <Row label="Email" value={email} />
                <Row label="Company" value={company} />
                <Row label="Job title" value={jobTitle} />
                <Row label="Phone" value={phone} />
                <Row label="Workforce size" value={workforceSize} />
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: '#E2E8F0', margin: '20px 0' }} />

          <Text style={{ color: '#5B6B7C', fontSize: '13px', margin: '0 0 6px' }}>Message</Text>
          <Text
            style={{
              color: '#0A2540',
              fontSize: '14px',
              lineHeight: '22px',
              backgroundColor: '#F4F6F8',
              padding: '12px 16px',
              borderRadius: '6px',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message}
          </Text>

          <Hr style={{ borderColor: '#E2E8F0', margin: '20px 0' }} />
          <Text style={{ color: '#8A97A5', fontSize: '12px', margin: 0 }}>
            Reply directly to this email to respond to {fullName}. DDHS Equity Intelligence (Pty)
            Ltd · Employment Equity compliance, workforce transformation and governance.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: EnquiryNotification,
  subject: (data: Record<string, any>) =>
    `New enquiry: ${data['fullName'] ?? 'Website visitor'} — ${data['company'] ?? 'DDHS Equity Intelligence website'}`,
  displayName: 'Contact form enquiry notification',
  to: 'sdm@ddhs.co.za',
  previewData: {
    fullName: 'Thandi Nkosi',
    email: 'thandi@example.co.za',
    company: 'Example Holdings',
    jobTitle: 'HR Director',
    workforceSize: '200 – 499 employees',
    message:
      'We need help preparing our EEA2 and EEA4 submissions before the deadline. Can we set up a call next week?',
  },
} satisfies TemplateEntry
