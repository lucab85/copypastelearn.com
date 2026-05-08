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

interface OrderConfirmationEmailProps {
  orderId: string;
  amount: string;
  currency: string;
  productTitles: string[];
  downloadUrl: string;
  supportEmail: string;
  appUrl: string;
}

/**
 * Order confirmation email — rendered to HTML by `email.ts` and
 * delivered via Resend. Includes the time-boxed access link plus
 * library link as fallback.
 */
export function OrderConfirmationEmail({
  orderId,
  amount,
  currency,
  productTitles,
  downloadUrl,
  supportEmail,
  appUrl,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your CopyPasteLearn order is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks for your purchase</Heading>
          <Text style={subtle}>
            Order <strong>{orderId}</strong> — {amount} {currency}
          </Text>

          <Section style={list}>
            {productTitles.map((title) => (
              <Text key={title} style={listItem}>
                • {title}
              </Text>
            ))}
          </Section>

          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={downloadUrl} style={button}>
              Access your files
            </Button>
          </Section>

          <Text style={fineprint}>
            Your access link is valid for 24 hours and allows up to 3
            downloads. You can always sign in at{" "}
            <a href={`${appUrl}/library`}>{appUrl}/library</a> to generate a
            fresh link.
          </Text>

          <Hr style={hr} />

          <Text style={fineprint}>
            Need help? Email us at{" "}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f8fafc", fontFamily: "ui-sans-serif, system-ui, sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "560px" };
const h1 = { fontSize: "20px", fontWeight: "bold", margin: "0 0 16px" };
const subtle = { color: "#475569", fontSize: "14px" };
const list = { margin: "16px 0" };
const listItem = { margin: "4px 0", fontSize: "14px" };
const button = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
};
const fineprint = { color: "#64748b", fontSize: "13px" };
const hr = { borderColor: "#e2e8f0", margin: "24px 0" };

export default OrderConfirmationEmail;
