import { Button } from "@/components/ui/button";
import { Clock3, MailCheck } from "lucide-react";
import Link from "next/link";

const PurchasePendingPage = () => {
  return (
    <div className="container my-8">
      <section className="surface-panel mx-auto max-w-2xl p-6 text-center sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <Clock3 className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">
          Your payment is processing
        </h1>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
          Some payment methods take a little longer to confirm. Course access
          will appear automatically after Stripe confirms the payment.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-left text-sm">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Check your email for the payment receipt. You can safely leave this
            page and return to My Courses later.
          </p>
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/courses">Check My Courses</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/purchases">View Purchases</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PurchasePendingPage;
