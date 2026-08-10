import { Shield, ArrowLeft } from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-navy-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-gold transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Privacy Policy</h1>
          </div>
          <p className="text-sm text-slate-400 mb-8">
            Last Updated: August 10, 2026 | Effective Date: August 10, 2026
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300 leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">1. INTRODUCTION</h2>
              <p>
                Aeterna ("we", "us", "our", "the Company") is committed to protecting the privacy of our users ("you", "your", "User"). 
                This Privacy Policy explains how we collect, use, store, and protect your information in compliance with the 
                <strong> Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, Information Technology Act, 2000, and IT (Reasonable Security Practices) Rules, 2011.
              </p>
              <p>
                By using our Service, you consent to the data practices described in this policy. This policy should be read in conjunction 
                with our Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">2. DATA WE COLLECT</h2>
              
              <h3 className="text-md font-medium text-gold mt-4">2.1 Data We CAN Access (Plaintext)</h3>
              <table className="w-full text-sm border border-navy-700 rounded-lg overflow-hidden">
                <thead className="bg-navy-800">
                  <tr>
                    <th className="text-left p-3 text-slate-300">Data</th>
                    <th className="text-left p-3 text-slate-300">Purpose</th>
                    <th className="text-left p-3 text-slate-300">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                  <tr><td className="p-3">Email address</td><td className="p-3">Account authentication, notifications</td><td className="p-3">Consent + Contract</td></tr>
                  <tr><td className="p-3">Account creation timestamp</td><td className="p-3">Service provision</td><td className="p-3">Legitimate interest</td></tr>
                  <tr><td className="p-3">Last heartbeat timestamp</td><td className="p-3">Dead Man's Switch operation</td><td className="p-3">Contract</td></tr>
                  <tr><td className="p-3">Subscription plan</td><td className="p-3">Feature access control</td><td className="p-3">Contract</td></tr>
                  <tr><td className="p-3">IP address (server logs)</td><td className="p-3">Security, abuse prevention</td><td className="p-3">Legitimate interest</td></tr>
                </tbody>
              </table>

              <h3 className="text-md font-medium text-gold mt-4">2.2 Data We CANNOT Access (Encrypted)</h3>
              <p className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-300">
                The following data is encrypted client-side with AES-256-GCM using your Master Password before transmission. 
                <strong> We store ONLY the encrypted ciphertext. We physically CANNOT decrypt, read, or access this data:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vault contents (passwords, secrets, cryptocurrency keys, notes)</li>
                <li>Beneficiary names and contact details</li>
                <li>Asset names and descriptions</li>
                <li>Uploaded documents and files</li>
                <li>Video/voice messages</li>
                <li>2FA recovery codes</li>
                <li>Time capsule messages</li>
                <li>All metadata within vaults</li>
              </ul>

              <h3 className="text-md font-medium text-gold mt-4">2.3 Data We NEVER Collect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Master Password (never transmitted, never stored)</li>
                <li>Biometric data</li>
                <li>Location data (GPS)</li>
                <li>Contact lists or phone book</li>
                <li>Browsing history</li>
                <li>Device identifiers (IMEI, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">3. HOW WE USE YOUR DATA</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide and maintain the Service</li>
                <li>To authenticate your identity via Amazon Cognito</li>
                <li>To operate the Dead Man's Switch (heartbeat monitoring)</li>
                <li>To send notifications to you and your designated beneficiaries when triggered</li>
                <li>To process payments and manage subscriptions</li>
                <li>To prevent abuse and maintain security</li>
                <li>To comply with legal obligations</li>
              </ul>
              <p className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-300">
                <strong>We do NOT:</strong> sell your data to third parties, use your data for advertising, share your data with marketers, 
                use your data for profiling, or monetize your data in any way beyond providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">4. DATA STORAGE AND SECURITY</h2>
              <table className="w-full text-sm border border-navy-700 rounded-lg overflow-hidden">
                <thead className="bg-navy-800">
                  <tr>
                    <th className="text-left p-3 text-slate-300">Measure</th>
                    <th className="text-left p-3 text-slate-300">Implementation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                  <tr><td className="p-3">Encryption at Rest</td><td className="p-3">AES-256-GCM (client-side, before upload)</td></tr>
                  <tr><td className="p-3">Encryption in Transit</td><td className="p-3">TLS 1.3 (HTTPS enforced)</td></tr>
                  <tr><td className="p-3">Key Derivation</td><td className="p-3">PBKDF2-SHA256, 600,000 iterations</td></tr>
                  <tr><td className="p-3">Authentication</td><td className="p-3">Amazon Cognito (AWS managed)</td></tr>
                  <tr><td className="p-3">Database</td><td className="p-3">Amazon DynamoDB (encrypted at rest by AWS)</td></tr>
                  <tr><td className="p-3">Hosting</td><td className="p-3">Amazon S3 + CloudFront (AWS global infrastructure)</td></tr>
                  <tr><td className="p-3">Access Control</td><td className="p-3">IAM roles, least-privilege access</td></tr>
                </tbody>
              </table>
              <p className="mt-3 text-sm text-slate-400">
                Data is stored in AWS us-east-1 region. AWS maintains SOC 2, ISO 27001, and PCI DSS compliance certifications.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">5. THIRD-PARTY SERVICES</h2>
              <p>We use the following third-party services:</p>
              <table className="w-full text-sm border border-navy-700 rounded-lg overflow-hidden">
                <thead className="bg-navy-800">
                  <tr>
                    <th className="text-left p-3 text-slate-300">Service</th>
                    <th className="text-left p-3 text-slate-300">Provider</th>
                    <th className="text-left p-3 text-slate-300">Purpose</th>
                    <th className="text-left p-3 text-slate-300">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                  <tr><td className="p-3">Authentication</td><td className="p-3">Amazon Cognito</td><td className="p-3">User login</td><td className="p-3">Email, password hash</td></tr>
                  <tr><td className="p-3">Database</td><td className="p-3">Amazon DynamoDB</td><td className="p-3">Data storage</td><td className="p-3">Encrypted ciphertext only</td></tr>
                  <tr><td className="p-3">Email</td><td className="p-3">Amazon SES</td><td className="p-3">Notifications</td><td className="p-3">Recipient email address</td></tr>
                  <tr><td className="p-3">Payments</td><td className="p-3">Stripe</td><td className="p-3">Subscription billing</td><td className="p-3">Payment card details (to Stripe directly)</td></tr>
                  <tr><td className="p-3">CDN</td><td className="p-3">Amazon CloudFront</td><td className="p-3">Content delivery</td><td className="p-3">IP address (standard CDN operation)</td></tr>
                </tbody>
              </table>
              <p className="mt-3 text-sm">
                Each third-party service operates under its own privacy policy. We recommend reviewing their policies independently.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">6. DATA RETENTION</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Active accounts:</strong> Data retained for the duration of your account's existence.</li>
                <li><strong>Deleted accounts:</strong> All data permanently deleted within 30 days of account deletion.</li>
                <li><strong>Triggered vaults:</strong> Retained for 45 days after switch triggers (for beneficiary access), then subject to unclaimed estate policy.</li>
                <li><strong>Server logs:</strong> IP addresses and access logs retained for 90 days for security purposes, then automatically deleted.</li>
                <li><strong>Payment records:</strong> Retained as required by Indian tax law (minimum 7 years for financial records).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">7. YOUR RIGHTS (DPDP Act 2023)</h2>
              <p>Under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Right to Access:</strong> Request information about what personal data we hold about you.</li>
                <li><strong>Right to Correction:</strong> Request correction of inaccurate personal data.</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data (by deleting your account).</li>
                <li><strong>Right to Nominate:</strong> Nominate another person to exercise your rights in case of death or incapacity.</li>
                <li><strong>Right to Grievance Redressal:</strong> Raise complaints regarding data processing.</li>
              </ul>
              <p className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-300 mt-3">
                <strong>Important Note:</strong> Due to our end-to-end encryption architecture, we CANNOT access, modify, or provide copies 
                of your encrypted vault data. The right to access and correction applies only to plaintext data (email, account metadata). 
                For encrypted data, you must use your Master Password to access it yourself.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">8. DATA BREACH NOTIFICATION</h2>
              <p>In the event of a personal data breach:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We will notify the Data Protection Board of India within 72 hours as mandated by the DPDP Act.</li>
                <li>We will notify affected users via email within 72 hours of confirming the breach.</li>
                <li>The notification will include: nature of the breach, data affected, remedial measures taken, and contact information for further queries.</li>
                <li>Due to client-side encryption, a server breach exposes only encrypted ciphertext — NOT your actual data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">9. COOKIES AND LOCAL STORAGE</h2>
              <p>We use:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Authentication tokens:</strong> Stored in browser memory (session-based) for login persistence.</li>
                <li><strong>Local Storage:</strong> Used for storing encrypted documents locally, user preferences (theme, dismissed cards), and subscription plan status.</li>
                <li><strong>No tracking cookies:</strong> We do NOT use advertising cookies, analytics trackers (Google Analytics, etc.), or any third-party tracking pixels.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">10. CHILDREN'S PRIVACY</h2>
              <p>
                The Service is not intended for users under 18 years of age. We do not knowingly collect personal data from children. 
                If we discover that a user is under 18, we will immediately terminate the account and delete associated data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">11. INTERNATIONAL DATA TRANSFERS</h2>
              <p>
                Your data is processed and stored on Amazon Web Services infrastructure. While primary storage is in the US (us-east-1), 
                AWS may process data across regions for performance and redundancy. By using the Service, you consent to this international 
                transfer. All transfers are protected by TLS encryption and AWS's compliance certifications.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">12. LAW ENFORCEMENT AND GOVERNMENT REQUESTS</h2>
              <p>
                If we receive a valid legal request (court order, subpoena) from Indian law enforcement:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>We can provide: email address, account creation date, last login timestamp, subscription status, and IP logs.</li>
                <li>We <strong>CANNOT</strong> provide: vault contents, documents, passwords, messages, or any encrypted data — as we do not possess the decryption capability.</li>
                <li>We will notify the user of such requests unless legally prohibited from doing so.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">13. CHANGES TO THIS POLICY</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. 
                Material changes will be communicated via email or in-app notification. Continued use of the Service after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">14. DATA PROTECTION OFFICER</h2>
              <p>
                For any privacy-related queries, complaints, or to exercise your rights under the DPDP Act, contact: <br />
                <span className="text-gold">privacy@aeterna.in</span> <br />
                Data Protection Officer, Aeterna Digital Services <br />
                Hyderabad, Telangana, India
              </p>
              <p className="mt-3 text-sm text-slate-400">
                If you are not satisfied with our response, you may file a complaint with the Data Protection Board of India 
                as established under the DPDP Act, 2023.
              </p>
            </section>

            <section className="bg-navy-800 border border-navy-700 rounded-xl p-6 mt-8">
              <h2 className="text-lg font-semibold text-emerald-400 mb-3">🔒 Our Privacy Promise</h2>
              <ul className="space-y-2 text-slate-200">
                <li>✅ We encrypt your data before it leaves your device</li>
                <li>✅ We cannot read your data even if we wanted to</li>
                <li>✅ We will never sell your data to anyone</li>
                <li>✅ We use no advertising trackers or analytics</li>
                <li>✅ We will notify you of any breach within 72 hours</li>
                <li>✅ You can delete your account and all data at any time</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
