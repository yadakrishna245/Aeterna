import type { Handler } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({});

/**
 * The verified sender email address for SES.
 * Must be verified in AWS SES console before use.
 */
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || "noreply@aeterna.app";

interface NotificationEvent {
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Send Notification Lambda
 *
 * Sends an email via AWS SES.
 * Accepts: recipientEmail, subject, htmlBody, textBody
 *
 * Designed to be invoked by the heartbeat-monitor or other internal functions.
 */
export const handler: Handler<NotificationEvent> = async (event) => {
  const { recipientEmail, subject, htmlBody, textBody } = event;

  console.log(`📧 Send Notification invoked`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   Subject: ${subject}`);

  // Validate required fields
  if (!recipientEmail || !subject) {
    const error = "Missing required fields: recipientEmail and subject are required.";
    console.error(`❌ Validation failed: ${error}`);
    return {
      statusCode: 400,
      body: JSON.stringify({ error }),
    };
  }

  if (!htmlBody && !textBody) {
    const error = "At least one of htmlBody or textBody must be provided.";
    console.error(`❌ Validation failed: ${error}`);
    return {
      statusCode: 400,
      body: JSON.stringify({ error }),
    };
  }

  try {
    const command = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          ...(htmlBody && {
            Html: {
              Data: htmlBody,
              Charset: "UTF-8",
            },
          }),
          ...(textBody && {
            Text: {
              Data: textBody,
              Charset: "UTF-8",
            },
          }),
        },
      },
    });

    const result = await ses.send(command);

    console.log(`✅ Email sent successfully`);
    console.log(`   MessageId: ${result.MessageId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: result.MessageId,
        recipient: recipientEmail,
      }),
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown SES error";
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error(`❌ Failed to send email to ${recipientEmail}`);
    console.error(`   Error: ${errorName} — ${errorMessage}`);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: errorName,
        message: errorMessage,
        recipient: recipientEmail,
      }),
    };
  }
};
