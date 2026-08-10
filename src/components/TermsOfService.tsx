import { Shield, ArrowLeft } from "lucide-react";

interface TermsOfServiceProps {
  onBack?: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Terms of Service</h1>
          </div>
          <p className="text-sm text-slate-400 mb-8">
            Last Updated: August 10, 2026 | Effective Date: August 10, 2026
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300 leading-relaxed">
            
            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">1. ACCEPTANCE OF TERMS</h2>
              <p>
                By creating an account, accessing, or using Aeterna ("the Service", "the Platform", "the Application"), 
                you ("User", "You", "Your") unconditionally agree to be bound by these Terms of Service ("Terms"), 
                our Privacy Policy, and all applicable laws and regulations of India. 
                <strong className="text-gold"> If you do not agree to these Terms, you must immediately cease using the Service.</strong>
              </p>
              <p>
                Your use of the Service constitutes a legally binding agreement between you and Aeterna ("we", "us", "our", "the Company", "the Platform Owner"). 
                By clicking "I Accept" or by creating an account, you acknowledge that you have read, understood, and agree to be legally bound by these Terms 
                in their entirety, including all limitations of liability, disclaimers, and indemnification obligations herein.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">2. NATURE OF SERVICE</h2>
              <p>
                Aeterna is a digital estate planning and encrypted data storage tool. The Service provides:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Client-side encryption and storage of user-provided data</li>
                <li>A "Dead Man's Switch" mechanism that releases encrypted data to designated beneficiaries upon prolonged user inactivity</li>
                <li>Document storage with client-side encryption</li>
                <li>Beneficiary management and notification systems</li>
              </ul>
              <p className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300">
                <strong>CRITICAL DISCLAIMER:</strong> Aeterna is NOT a legal will, testament, trust, or legally binding estate planning instrument. 
                It is a SOFTWARE TOOL only. It does NOT replace the need for a legally executed will, probate proceedings, or professional legal counsel. 
                Users are strongly advised to create proper legal documents (will, trust, power of attorney) through qualified legal professionals 
                in addition to using this Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">3. CLIENT-SIDE ENCRYPTION — ABSOLUTE USER RESPONSIBILITY</h2>
              <p>
                The Service employs client-side encryption (AES-256-GCM with PBKDF2 key derivation). This means:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-gold">All encryption and decryption occurs exclusively in your browser/device.</strong> The server 
                  stores only encrypted ciphertext that is mathematically impossible to decrypt without your Master Password.
                </li>
                <li>
                  <strong className="text-gold">We do NOT store, transmit, receive, or have access to your Master Password at any point.</strong> Your 
                  Master Password never leaves your device.
                </li>
                <li>
                  <strong className="text-gold">If you lose or forget your Master Password, your data is PERMANENTLY AND IRREVERSIBLY LOST.</strong> We 
                  have absolutely no ability to recover, reset, or bypass your Master Password. There is no "forgot password" option for Master Password recovery.
                </li>
                <li>
                  <strong className="text-gold">We CANNOT access, read, view, or decrypt your stored data under any circumstances</strong> — including 
                  but not limited to: court orders, law enforcement requests, subpoenas, government orders, or any other legal process. We physically 
                  do not possess the capability to decrypt your data.
                </li>
              </ul>
              <p className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-300">
                <strong>YOU ACKNOWLEDGE AND ACCEPT FULL RESPONSIBILITY</strong> for maintaining and safeguarding your Master Password. 
                The Company bears ZERO liability for any data loss, inaccessibility, or failure to deliver vaults to beneficiaries 
                resulting from a lost, forgotten, compromised, or incorrectly entered Master Password.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">4. DEAD MAN'S SWITCH — DISCLAIMER OF RELIABILITY</h2>
              <p>The Dead Man's Switch mechanism is provided on an <strong>"AS IS" and "AS AVAILABLE"</strong> basis. You acknowledge that:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The switch mechanism depends on email delivery, internet connectivity, server availability, and third-party services (AWS) — none of which are guaranteed to be 100% reliable.</li>
                <li>Emails may be delayed, filtered to spam, blocked by email providers, or fail to deliver entirely.</li>
                <li>The Company does NOT guarantee that beneficiaries will receive notifications or access to vaults in any specific timeframe, or at all.</li>
                <li>Server outages, maintenance, force majeure events, or technical failures may delay or prevent switch triggering.</li>
                <li>The Company is NOT responsible if the switch triggers prematurely (false positive) or fails to trigger (false negative).</li>
                <li>Beneficiary email addresses provided by the User may be incorrect, outdated, or inaccessible — the Company bears no responsibility for verifying beneficiary contact details.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">5. LIMITATION OF LIABILITY</h2>
              <p className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  The Company, its owners, directors, employees, agents, affiliates, and service providers shall <strong>NOT be liable for ANY direct, 
                  indirect, incidental, special, consequential, punitive, or exemplary damages</strong>, including but not limited to: loss of data, 
                  loss of profits, loss of cryptocurrency or digital assets, loss of access to accounts, emotional distress, loss of inheritance, 
                  or any other damages arising from or related to your use of the Service.
                </li>
                <li>
                  <strong>IN NO EVENT shall the total aggregate liability of the Company exceed the amount paid by you to the Company in the 
                  twelve (12) months preceding the claim, or ₹499 (Indian Rupees Four Hundred Ninety-Nine), whichever is LESS.</strong>
                </li>
                <li>
                  This limitation applies regardless of the legal theory (contract, tort, negligence, strict liability, or otherwise) 
                  and even if the Company has been advised of the possibility of such damages.
                </li>
                <li>
                  The Company is NOT liable for any losses arising from: (a) unauthorized access to your account due to your failure to maintain 
                  security of your credentials; (b) loss of Master Password; (c) failure of beneficiaries to access or claim released vaults; 
                  (d) premature or delayed triggering of the Dead Man's Switch; (e) accuracy, completeness, or legality of data stored by the User; 
                  (f) any actions taken by beneficiaries upon receiving vault access; (g) third-party service failures (AWS, email providers, internet service providers).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">6. INDEMNIFICATION</h2>
              <p>
                You agree to <strong>indemnify, defend, and hold harmless</strong> the Company, its owners, directors, officers, employees, agents, 
                licensors, and service providers from and against <strong>any and all claims, damages, losses, liabilities, costs, and expenses</strong> 
                (including reasonable attorney's fees) arising from or relating to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your use of or inability to use the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable law or regulation</li>
                <li>Any data or content you store, upload, or transmit through the Service</li>
                <li>Any claim by a third party (including beneficiaries, heirs, family members, or legal representatives) related to data released or not released by the Service</li>
                <li>Any dispute between you and your designated beneficiaries</li>
                <li>Any illegal, fraudulent, or unauthorized content stored using the Service</li>
                <li>Your failure to maintain adequate security of your account credentials and Master Password</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">7. USER RESPONSIBILITIES AND REPRESENTATIONS</h2>
              <p>By using the Service, you represent and warrant that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are at least 18 years of age and legally competent to enter into binding agreements</li>
                <li>You will use the Service only for lawful purposes</li>
                <li>You will NOT store any illegal content, including but not limited to: child exploitation material, terrorist content, stolen data, or content that violates any applicable law</li>
                <li>You are solely responsible for the accuracy of beneficiary information provided</li>
                <li>You understand that the Company cannot verify the identity of beneficiaries and bears no responsibility for vault access by incorrect or malicious parties due to user error</li>
                <li>You will maintain the security of your account credentials (email, password, and Master Password)</li>
                <li>You will maintain backup copies of critical data and NOT rely solely on this Service</li>
                <li>You acknowledge this Service is NOT a substitute for legal estate planning</li>
                <li>You will inform relevant persons (family, lawyer) about the existence of your Aeterna account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">8. DATA SECURITY AND BREACH</h2>
              <p>
                We implement industry-standard security measures including AES-256-GCM encryption, TLS transport security, 
                and AWS infrastructure security. However:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>No system is 100% secure.</strong> While we employ reasonable security measures, we do NOT guarantee that 
                  the Service will be free from security vulnerabilities, hacking attempts, or unauthorized access.
                </li>
                <li>
                  In the event of a server-side data breach, <strong>all user data stored on our servers is encrypted ciphertext</strong> that 
                  cannot be decrypted without individual user Master Passwords (which we do not possess). Therefore, a server breach 
                  does NOT expose user plaintext data.
                </li>
                <li>
                  The Company will notify affected users of any confirmed breach within 72 hours as required under the 
                  Digital Personal Data Protection Act, 2023 (DPDP Act).
                </li>
                <li>
                  <strong>The Company's liability in case of breach is limited to encrypted ciphertext only</strong>, as we never possess, 
                  store, or transmit user plaintext data or Master Passwords.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">9. SERVICE AVAILABILITY — NO GUARANTEE</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>The Service is provided <strong>"AS IS" and "AS AVAILABLE"</strong> without warranties of any kind, whether express, implied, or statutory.</li>
                <li>We do NOT guarantee uninterrupted, timely, secure, or error-free operation of the Service.</li>
                <li>We may modify, suspend, or discontinue the Service (in whole or part) at any time, with or without notice.</li>
                <li>We are NOT liable for any loss or damage resulting from service interruptions, downtime, or discontinuation.</li>
                <li>We disclaim all implied warranties including merchantability, fitness for a particular purpose, and non-infringement.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">10. ACCOUNT TERMINATION</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>We reserve the right to suspend or terminate your account at any time, for any reason, with or without notice.</li>
                <li>Upon termination, your encrypted data may be permanently deleted after 30 days.</li>
                <li>You may delete your account at any time. Deletion is permanent and irreversible.</li>
                <li>Termination does not relieve you of obligations incurred before termination, including indemnification obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">11. INTELLECTUAL PROPERTY</h2>
              <p>
                All rights, title, and interest in the Service (including but not limited to source code, design, branding, logos, 
                documentation, and technology) are owned exclusively by the Company. Users retain ownership of their uploaded content 
                but grant the Company a limited license to store encrypted versions of such content for the purpose of providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">12. FORCE MAJEURE</h2>
              <p>
                The Company shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, 
                including but not limited to: acts of God, natural disasters, war, terrorism, riots, pandemics, government actions, 
                power outages, internet outages, AWS/cloud service provider failures, cyberattacks, or any other event beyond our reasonable control.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">13. DISPUTE RESOLUTION AND GOVERNING LAW</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of India, specifically the Information Technology Act 2000, Indian Contract Act 1872, Digital Personal Data Protection Act 2023, and Consumer Protection Act 2019.</li>
                <li><strong>Jurisdiction:</strong> Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.</li>
                <li><strong>Mandatory Arbitration:</strong> Before initiating any legal proceedings, parties agree to attempt resolution through binding arbitration under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English, in Hyderabad, by a sole arbitrator mutually appointed.</li>
                <li><strong>Class Action Waiver:</strong> You agree to resolve disputes with us on an individual basis only. You waive the right to participate in a class action, collective action, or representative action.</li>
                <li><strong>Limitation Period:</strong> Any claim arising from or related to the Service must be filed within ONE (1) year of the event giving rise to the claim. Claims filed after this period are permanently barred.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">14. PAYMENT AND REFUND POLICY</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Free tier users have limited features as described in the pricing section.</li>
                <li>Paid subscriptions are billed annually. Payments are non-refundable except as required by applicable law.</li>
                <li>We reserve the right to change pricing at any time with 30 days advance notice.</li>
                <li>Failure to pay does not relieve you of your obligations under these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">15. THIRD-PARTY SERVICES</h2>
              <p>
                The Service relies on third-party infrastructure providers including Amazon Web Services (AWS), email service providers, 
                and payment processors. The Company is NOT responsible for failures, outages, data loss, or service disruptions caused by 
                these third-party providers. Third-party services are governed by their own terms and privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">16. MODIFICATIONS TO TERMS</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective upon posting to the Service. 
                Continued use of the Service after changes constitutes acceptance of modified Terms. For material changes, 
                we will make reasonable efforts to notify users via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">17. SEVERABILITY</h2>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, 
                such invalidity shall not affect the remaining provisions, which shall continue in full force and effect. The invalid 
                provision shall be modified to the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">18. ENTIRE AGREEMENT</h2>
              <p>
                These Terms, together with the Privacy Policy, constitute the entire agreement between you and the Company regarding 
                the Service and supersede all prior agreements, representations, and understandings. No waiver of any provision shall 
                be deemed a further or continuing waiver of such provision or any other provision.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-100 border-b border-navy-700 pb-2">19. CONTACT</h2>
              <p>
                For questions regarding these Terms, contact us at: <br />
                <span className="text-gold">legal@aeterna.in</span> <br />
                Aeterna Digital Services, Hyderabad, Telangana, India
              </p>
            </section>

            <section className="bg-navy-800 border border-navy-700 rounded-xl p-6 mt-8">
              <h2 className="text-lg font-semibold text-red-400 mb-3">⚠️ ACKNOWLEDGMENT</h2>
              <p className="text-slate-200">
                BY CREATING AN ACCOUNT OR USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE IN THEIR ENTIRETY, 
                UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. YOU FURTHER ACKNOWLEDGE THAT THESE TERMS CONSTITUTE A LEGALLY BINDING 
                AGREEMENT AND THAT YOU HAVE HAD THE OPPORTUNITY TO SEEK INDEPENDENT LEGAL COUNSEL BEFORE ACCEPTING.
              </p>
              <p className="text-slate-400 mt-3 text-sm">
                You specifically acknowledge and accept: (a) the limitation of liability provisions; (b) the indemnification obligations; 
                (c) that the Company cannot recover lost Master Passwords; (d) that the Service is not a legal will or testament; 
                (e) the mandatory arbitration and class action waiver clauses; (f) the one-year limitation period for claims.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
