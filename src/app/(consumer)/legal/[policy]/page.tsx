import { notFound } from "next/navigation";

const policies = {
  terms: {
    title: "Terms of Service",
    sections: [
      ["Using the service", "You must provide accurate account information, keep your credentials secure, and use the platform lawfully. Course access is personal and may not be resold or shared."],
      ["Purchases and access", "A completed payment grants access to the courses included in the purchased product. Access may be withdrawn after a refund, chargeback, account deletion, or material breach of these terms."],
      ["Learning content", "Course materials are protected by intellectual-property laws. You may use them for your personal learning but may not redistribute, reproduce, or commercially exploit them without written permission."],
      ["Availability and changes", "We may improve, replace, or discontinue features and content. We will use reasonable care to keep paid learning content available and communicate material changes."],
      ["Contact", "Questions about these terms can be sent to the support address shown in your purchase receipt."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["Data we collect", "We collect account and profile details, purchase records, course access, lesson progress, quiz results, reviews, notes, bookmarks, device and service logs, and communications needed to operate the platform."],
      ["How we use data", "We use this data to provide courses, process payments, secure accounts, deliver transactional messages, support learners, measure product performance, meet legal obligations, and prevent misuse."],
      ["Processors and retention", "Payment and email providers process limited data on our behalf. We retain business records where legally required and otherwise keep personal data only as long as needed for the purposes described here."],
      ["Your choices", "You can update your profile and export or delete your account from Profile. Some anonymized transaction records may remain where accounting, fraud-prevention, or legal obligations require them."],
    ],
  },
  refunds: {
    title: "Refund Policy",
    sections: [
      ["Eligibility", "Unless a product states otherwise, you may request a refund within 30 days of purchase. Refunds may be refused where required by law or in cases of abuse, fraud, or substantial consumption of the course."],
      ["What happens after a refund", "Approved refunds are returned to the original payment method. Course access associated only with the refunded purchase is removed; access retained through another active purchase or a manual grant is unaffected."],
      ["Timing", "We submit approved refunds promptly. Your bank or card provider controls when the credit appears on your statement."],
    ],
  },
  cookies: {
    title: "Cookie Policy",
    sections: [
      ["Essential storage", "We use essential browser storage to keep you signed in, protect account sessions, remember necessary preferences, and complete checkout. The service cannot function correctly without it."],
      ["Third-party services", "Our payment and embedded media providers may set their own essential or preference cookies when you use checkout or play hosted media. Their policies govern that data."],
      ["Managing cookies", "You can remove or block cookies in your browser. Doing so may sign you out or prevent checkout, saved preferences, and embedded content from working."],
    ],
  },
} as const;

export default async function LegalPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const document = policies[policy as keyof typeof policies];
  if (!document) notFound();
  return (
    <article className="page-shell mx-auto max-w-3xl">
      <p className="text-sm text-muted-foreground">Effective June 20, 2026</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{document.title}</h1>
      <div className="mt-8 space-y-8">
        {document.sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-muted-foreground">{text}</p></section>)}
      </div>
    </article>
  );
}
