import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Vault: a
    .model({
      assetName: a.string().required(),
      encryptedPayload: a.string().required(),
      iv: a.string().required(),
      salt: a.string().required(),
      heirEmail: a.string().required(),
      heartbeatIntervalDays: a.integer().required(),
      lastHeartbeat: a.string().required(),
      status: a.enum(["ACTIVE", "TRIGGERED", "PAUSED"]),
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
