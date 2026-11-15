ALTER TABLE public.inclusion_pulse_links
 ADD COLUMN recipient_email text NOT NULL DEFAULT '',
 ADD COLUMN invitation_sent_at timestamptz;

GRANT INSERT(recipient_email) ON public.inclusion_pulse_links TO authenticated;

COMMENT ON COLUMN public.inclusion_pulse_links.recipient_email IS 'Employee invitation address; visible only through authorised workspace link administration.';
COMMENT ON COLUMN public.inclusion_pulse_links.invitation_sent_at IS 'Set by the server only after the individual invitation email is accepted for delivery.';
