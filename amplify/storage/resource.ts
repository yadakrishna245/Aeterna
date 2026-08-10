import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "aeternaDocuments",
  access: (allow) => ({
    // Each user gets their own private folder: documents/{user_id}/*
    "documents/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
});
