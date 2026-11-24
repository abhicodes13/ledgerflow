import { A, LegalPage, P, UL } from "../components/legal/LegalPage";
import { LEGAL } from "../lib/legal";

const { company, contactEmail: email } = LEGAL;

const SECTIONS = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <P>
        {company} is the service provider and controller of your account
        information. For information about your own clients, you decide why and
        how it's used, and we process it for you. You can reach us at{" "}
        <A href={`mailto:${email}`}>{email}</A>.
      </P>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <UL
        items={[
          "Account: your username, email address, and a password, which we store in hashed form rather than as plain text.",
          "Your business data: the clients, invoices, line items, due dates, and payment status you enter or create, including your clients' names, email addresses, and phone numbers.",
          "Billing: your plan, subscription status, and renewal date. Card details are collected and stored by Stripe, and we never see or store full card numbers.",
          "Payments setup: if you connect Stripe to accept payments, we keep your Stripe account reference and its setup status.",
          "AI assistant: the messages you send it, and the account details needed to answer, are processed to produce a response. We don't keep your conversation history on our servers, but we do keep usage counts so we can apply limits.",
          "Technical information: your IP address, browser type, and logs of errors and requests, used for security, rate limiting, and fixing problems.",
        ]}
      />
    ),
  },
  {
    id: "clients",
    title: "Your clients' information",
    body: (
      <P>
        When you add a client, you give us their details so we can run features
        for you, such as invoices, payment reminders, and payment pages. You're
        responsible for having a lawful reason to share that information with
        us. If one of your clients asks us about their information, we'll direct
        them to you.
      </P>
    ),
  },
  {
    id: "use",
    title: "How we use information",
    body: (
      <>
        <UL
          items={[
            "To provide, maintain, and improve the Service.",
            "To process subscriptions and payments.",
            "To send emails: password resets, billing notices, and the reminders you choose to send to your clients.",
            "To generate assistant responses.",
            "To protect the Service from fraud, abuse, and attacks.",
            "To meet legal obligations.",
          ]}
        />
        <P>
          We don't sell your personal information, and we don't use it for
          advertising.
        </P>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <P>
          We use trusted providers to run the Service. They only get the
          information they need to do their job.
        </P>
        <UL
          items={[
            "Stripe: subscriptions, billing, and payments from your clients.",
            "Resend: delivering the emails we send, such as password resets and reminders.",
            `${LEGAL.aiProvider}: processing the messages you send to the assistant.`,
            `Hosting: ${LEGAL.hosting}.`,
          ]}
        />
        <P>
          We may also share information if the law requires it, to protect our
          users or the Service, or as part of a merger or sale of the business.
          We'll tell you if that changes who holds your data.
        </P>
      </>
    ),
  },
  {
    id: "storage",
    title: "Cookies and local storage",
    body: (
      <P>
        We don't use advertising or tracking cookies. We use your browser's
        local storage to keep you signed in and to remember small preferences,
        such as your theme or whether you've hidden the getting-started
        checklist. The installable app also keeps one offline page on your
        device. Stripe may set its own cookies on its pages.
      </P>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <P>
        We keep your information while your account is open, and for as long as
        needed afterward for legal, accounting, and security reasons. When you
        ask us to delete your account, we remove your data, except what we must
        keep by law. Backups are overwritten on a regular schedule.
      </P>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <UL
          items={[
            "Connections to the Service use HTTPS.",
            "Passwords are hashed.",
            "Each account can only reach its own data.",
            "We limit repeated login and password-reset attempts.",
          ]}
        />
        <P>
          No system is perfectly secure, so we can't promise absolute security.
          If you think your account has been compromised, change your password
          and contact us.
        </P>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <P>
        You can see, correct, export, or delete your information. You can export
        your invoices and clients as CSV files from the app at any time, and you
        can email <A href={`mailto:${email}`}>{email}</A> to ask for anything
        else. Depending on where you live, you may have more rights, for example
        under the GDPR, the UK GDPR, or California law, including the right to
        object to or restrict certain uses and to complain to your local data
        protection authority. We'll respond within the time the law requires.
      </P>
    ),
  },
  {
    id: "transfers",
    title: "Where your information is processed",
    body: (
      <P>
        Our providers may process information in the United States and other
        countries. Where the law requires it, we rely on safeguards such as
        standard contractual clauses.
      </P>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <P>
        The Service is for people 18 and older. We don't knowingly collect
        information from children. If you believe a child has given us
        information, contact us and we'll delete it.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <P>
        We may update this policy. If a change is significant, we'll tell you by
        email or in the app before it takes effect. Our{" "}
        <A to="/terms">Terms of Service</A> explain the rest of how the Service
        works.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <P>
        Questions about your privacy? Email{" "}
        <A href={`mailto:${email}`}>{email}</A>.
      </P>
    ),
  },
];

export function PrivacyPage({ theme, setTheme }) {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what information we collect, how we use it, and the choices you have. We've kept it as short and plain as we can."
      sections={SECTIONS}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
