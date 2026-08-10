import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Vault: a
    .model({
      // Existing fields
      encryptedAssetName: a.string().required(),
      encryptedPayload: a.string().required(),
      iv: a.string().required(),
      salt: a.string().required(),
      encryptedHeirEmail: a.string().required(),
      heartbeatIntervalDays: a.integer().required(),
      lastHeartbeat: a.string().required(),
      status: a.enum(["ACTIVE", "GRACE_PERIOD", "TRIGGERED", "PAUSED", "DELIVERED"]),

      // New fields — grace period & reminders
      gracePeriodDays: a.integer().required(),
      remindersSent: a.integer().default(0),

      // Trigger type configuration
      triggerType: a.enum(["HEARTBEAT", "SCHEDULED_DATE"]),
      scheduledTriggerDate: a.string(),

      // Encrypted file/video references
      encryptedFileKeys: a.string(),
      encryptedVideoKey: a.string(),
      hasVideo: a.boolean(),
      hasFiles: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  Beneficiary: a
    .model({
      encryptedName: a.string().required(),
      encryptedEmail: a.string().required(),
      encryptedPhone: a.string(),
      relationship: a.string(),
      iv: a.string(),
      salt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  VaultBeneficiary: a
    .model({
      vaultId: a.string().required(),
      beneficiaryId: a.string().required(),
      accessLevel: a.enum(["FULL", "PARTIAL", "MESSAGE_ONLY"]),
    })
    .authorization((allow) => [allow.owner()]),

  ActivityLog: a
    .model({
      action: a.string().required(),
      timestamp: a.string().required(),
      metadata: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Document: a
    .model({
      name: a.string().required(),
      originalName: a.string().required(),
      category: a.string().required(),
      notes: a.string(),
      mimeType: a.string().required(),
      size: a.integer().required(),
      s3Key: a.string().required(),
      iv: a.string().required(),
      salt: a.string().required(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
