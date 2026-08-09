import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Aeterna - Verify Your Identity",
      verificationEmailBody: (createCode) =>
        `Your Aeterna verification code is: ${createCode()}`,
    },
  },
  userAttributes: {
    preferredUsername: {
      required: false,
      mutable: true,
    },
  },
});
