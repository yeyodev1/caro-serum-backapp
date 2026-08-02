import nodemailer from "nodemailer";
import { OrderDocument } from "../models/Order";

function transporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user, pass },
  });
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function sendWithResend(apiKey: string, from: string, to: string, subject: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error("Resend rejected the message");
}

export async function sendOrderEmail(order: OrderDocument, receiptUploaded = false, recipient = order.buyer?.email) {
  const mailer = transporter();
  const from = process.env.EMAIL_FROM?.trim() || process.env.SMTP_FROM?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const buyer = order.buyer;
  if ((!mailer && !resendApiKey) || !from || !buyer || !recipient) return false;

  const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim();
  const customerMessage = order.status === "paid"
    ? "Confirmamos tu pago. Gracias por elegir OMG Lashes; prepararemos tu pedido muy pronto."
    : receiptUploaded
    ? "Recibimos tu comprobante. Nuestro equipo verificara el pago y te escribira pronto."
    : order.paymentMethod === "transfer"
      ? "Tu pedido fue recibido. Realiza la transferencia y sube tu comprobante para que podamos verificarlo."
      : "Tu pedido fue recibido. Te avisaremos cuando el pago sea confirmado.";
  const siteUrl = (process.env.PUBLIC_SITE_URL?.trim() || "https://testing-storybrand-frontend.bakano.ec").replace(/\/+$/, "");
  const orderUrl = `${siteUrl}/order-status?reference=${encodeURIComponent(order.publicReference)}`;
  const whatsappUrl = `https://wa.me/593998655256?text=${encodeURIComponent(`Hola OMG Lashes, necesito ayuda con mi pedido ${order.publicReference}.`)}`;

  try {
    const customer = { to: recipient, subject: `OMG Lashes: pedido ${order.publicReference}`, text: `Hola ${buyer.firstName},\n\n${customerMessage}\n\nPedido: ${order.publicReference}\nTotal: ${money(order.totalCents)}.\n\nConsulta los detalles y el estado: ${orderUrl}\n\n¿Necesitas ayuda? Escríbenos por WhatsApp: ${whatsappUrl}\n\nPara una atención más rápida por WhatsApp, no modifiques el mensaje prellenado.` };
    const admin = adminEmail ? { to: adminEmail, subject: `${receiptUploaded ? "Comprobante recibido" : "Actualizacion de pedido"}: ${order.publicReference}`, text: `${buyer.firstName} ${buyer.lastName}\n${buyer.email}\n${buyer.phone}\nPedido: ${order.publicReference}\nTotal: ${money(order.totalCents)}\nEstado: ${order.status}` } : null;
    const messages = [customer, ...(admin ? [admin] : [])];
    const results = await Promise.allSettled(messages.map((message) => resendApiKey
      ? sendWithResend(resendApiKey, from, message.to, message.subject, message.text)
      : mailer!.sendMail({ from, ...message })));
    return results[0]?.status === "fulfilled";
  } catch (error) {
    console.error("Unable to send order email", error);
    return false;
  }
}
