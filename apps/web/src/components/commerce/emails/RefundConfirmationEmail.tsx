import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface RefundConfirmationEmailProps {
  orderId: string;
  amount: string;
  currency: string;
  reason?: string;
  appUrl: string;
}

/**
 * T078 [US4] — Refund confirmation email.
 * Rendered server-side from `processRefund` (T069).
 */
export function RefundConfirmationEmail({
  orderId,
  amount,
  currency,
  reason,
  appUrl,
}: RefundConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your refund of {amount} {currency} has been processed.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Refund processed
          </Heading>
          <Text style={p}>
            We have refunded <strong>{amount} {currency}</strong> for order{" "}
            <strong>{orderId}</strong>.
          </Text>
          {reason ? (
            <Text style={p}>
              <strong>Reason:</strong> {reason}
            </Text>
          ) : null}
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button href={`${appUrl}/library`} style={button}>
              View your library
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={small}>
            Funds typically appear in 5–10 business days depending on your
            bank. If you need help, reply to this email.
          </Text>
          <Text style={small}>CopyPasteLearn</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};
const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "32px 16px",
  maxWidth: "560px",
};
const h1: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 16px",
  color: "#0f172a",
};
const p: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#1f2937",
  margin: "0 0 12px",
};
const small: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#64748b",
  margin: "0 0 8px",
};
const button: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 20px",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: 600,
};
const hr: React.CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  margin: "20px 0",
};

export default RefundConfirmationEmail;
