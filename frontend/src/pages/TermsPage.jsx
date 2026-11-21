import { A, LegalPage, P, UL } from "../components/legal/LegalPage";
import { LEGAL } from "../lib/legal";

const { company, contactEmail: email } = LEGAL;

const SECTIONS = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: (
      <>
        <P>
          These Terms of Service ("Terms") are an agreement between you and{" "}
          {company} ("we", "us"). By creating an account or using {company} (the
          "Service"), you agree to these Terms and to our{" "}
          <A to="/privacy">Privacy Policy</A>. If you use the Service on behalf
          of a business, you confirm that you can accept these Terms for that
          business.
        </P>
        <P>If you don't agree, please don't use the Service.</P>
      </>
    ),
  },
  {
    id: "service",
    title: "The Service",
    body: (
      <P>
        {company} is software for creating invoices, tracking payments, managing
        clients, and sending payment reminders, with an AI assistant. Features
        marked Preview or Coming soon, such as Estimates and Signatures, run on
        sample data, aren't final, and may change or be removed.
      </P>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <UL
        items={[
          "You must be at least 18 years old.",
          "Give accurate information and keep it up to date.",
          "Keep your password secure. You're responsible for everything done through your account.",
          "Tell us right away if you think someone else has accessed your account.",
        ]}
      />
    ),
  },
  {
    id: "billing",
    title: "Plans, billing, and cancellation",
    body: (
      <UL
        items={[
          "Paid plans are billed monthly or yearly at the price shown when you subscribe. Prices are in US dollars and may not include taxes.",
          "Subscriptions renew automatically until you cancel. Payments are processed by Stripe.",
          "You can cancel at any time in Settings, under Plan and billing, which opens Stripe's secure billing portal.",
          LEGAL.refundPolicy,
          "If a payment fails, access to your invoices, clients, and the assistant may be paused until you update your payment method.",
          "We may change our prices. We'll give you notice before a change applies to your plan.",
        ]}
      />
    ),
  },
  {
    id: "payments",
    title: "Online payments from your clients",
    body: (
      <>
        <P>
          If you connect a Stripe account, payments from your clients are
          processed by Stripe under Stripe's own terms. We aren't a bank or a
          payment processor, and we don't hold your funds.
        </P>
        <UL
          items={[
            "You're responsible for your Stripe account, its fees, and its requirements.",
            "You're responsible for refunds, chargebacks, disputes, and taxes on the payments you receive.",
            "We aren't responsible for delays or failures caused by Stripe, your bank, or your client.",
          ]}
        />
      </>
    ),
  },
  {
    id: "ai",
    title: "The AI assistant",
    body: (
      <>
        <P>
          The assistant uses artificial intelligence to understand your requests
          and prepare actions. Its answers can be wrong or incomplete.
        </P>
        <UL
          items={[
            "It proposes actions, such as creating an invoice or sending reminders, and nothing happens until you confirm.",
            "You're responsible for reviewing each proposal before you confirm it.",
            "It doesn't provide accounting, tax, or legal advice.",
            "Usage limits may apply, and we may change them.",
            "Your messages are processed by a third-party AI provider, as described in the Privacy Policy.",
          ]}
        />
      </>
    ),
  },
  {
    id: "data",
    title: "Your data and your clients' data",
    body: (
      <UL
        items={[
          "You own the information you put into the Service, such as your clients and invoices.",
          "You give us permission to store and process it only to run the Service for you.",
          "You're responsible for having the right to add your clients' information and to contact them, including by email reminders.",
          "You're responsible for the invoices you create and for following the laws that apply to your business, including tax and consumer laws.",
        ]}
      />
    ),
  },
  {
    id: "use",
    title: "Acceptable use",
    body: (
      <>
        <P>You agree not to:</P>
        <UL
          items={[
            "use the Service for anything unlawful, fraudulent, or misleading, including false invoices",
            "send harassing, deceptive, or unwanted messages through reminders",
            "try to access other people's accounts or data, or probe or attack the Service",
            "reverse engineer, copy, or resell the Service without our permission",
            "overload the Service or interfere with other users",
            "upload malware or anything harmful",
          ]}
        />
      </>
    ),
  },
  {
    id: "ownership",
    title: "Our property",
    body: (
      <P>
        The Service, including its software, design, and branding, belongs to
        us. We give you a limited, non-exclusive, non-transferable right to use
        it while these Terms apply. If you send us feedback, we may use it
        without owing you anything.
      </P>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <P>
        We work to keep the Service running, but we can't promise it will always
        be available or error-free. We may update, change, or remove features,
        and we may carry out maintenance.
      </P>
    ),
  },
  {
    id: "termination",
    title: "Ending your use",
    body: (
      <UL
        items={[
          "You can stop using the Service at any time, and cancel your plan as described above.",
          "We may suspend or end your access if you break these Terms, don't pay, or if we must for legal reasons.",
          "Before your account closes, you can export your invoices and clients as CSV files.",
          <>
            You can ask us to delete your account and data by emailing{" "}
            <A href={`mailto:${email}`}>{email}</A>.
          </>,
        ]}
      />
    ),
  },
  {
    id: "warranty",
    title: "Disclaimers",
    body: (
      <P>
        The Service is provided "as is" and "as available". To the fullest
        extent the law allows, we don't give any warranties, express or implied,
        including about fitness for a particular purpose or that the Service
        will be uninterrupted or error-free. We don't guarantee that any invoice
        will be paid.
      </P>
    ),
  },
  {
    id: "liability",
    title: "Limit of liability",
    body: (
      <P>
        To the fullest extent the law allows, we aren't liable for indirect,
        incidental, special, or consequential damages, or for lost profits,
        revenue, or data. Our total liability for any claim relating to the
        Service is limited to the amount you paid us in the 12 months before the
        claim arose. Some places don't allow these limits, so they may not apply
        to you.
      </P>
    ),
  },
  {
    id: "indemnity",
    title: "Your responsibility for claims",
    body: (
      <P>
        You agree to cover claims, losses, and costs that come from your use of
        the Service in breach of these Terms, from your data, or from the
        invoices and messages you create and send.
      </P>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <P>
        These Terms are governed by the laws of {LEGAL.jurisdiction}, without
        regard to conflict-of-law rules. Courts located there will handle
        disputes, unless the law where you live gives you the right to bring a
        claim elsewhere.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    body: (
      <P>
        We may update these Terms. If a change is significant, we'll tell you by
        email or in the app before it takes effect. If you keep using the
        Service after that, you accept the new Terms.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <P>
        Questions about these Terms? Email{" "}
        <A href={`mailto:${email}`}>{email}</A>.
      </P>
    ),
  },
];

export function TermsPage({ theme, setTheme }) {
  return (
    <LegalPage
      title="Terms of Service"
      intro="Please read these terms carefully. They explain what you can expect from us and what we expect from you."
      sections={SECTIONS}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
