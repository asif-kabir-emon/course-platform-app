"use client";

import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  getClientSessionSecret,
  listAvailablePromotionCodes,
  validatePromotionCode,
} from "@/helpers/stripe/stripe";
import { stripeClientPromise } from "@/helpers/stripe/stripeClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";

type CheckoutProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInDollar: number;
};

export default function StripeCheckoutForm({
  product,
  user,
}: {
  product: CheckoutProduct;
  user: { email: string; id: string };
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [code, setCode] = useState("");
  const [availablePromotions, setAvailablePromotions] = useState<
    { code: string; label: string; discountInCent: number }[]
  >([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [applied, setApplied] = useState<{
    code: string;
    label: string;
    discountInCent?: number;
  }>();
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadPromotions = async () => {
      try {
        const result = await listAvailablePromotionCodes(product.id, user.id);
        if (mounted) setAvailablePromotions(result);
      } catch {
        if (mounted) setAvailablePromotions([]);
      } finally {
        if (mounted) setLoadingPromotions(false);
      }
    };

    void loadPromotions();

    return () => {
      mounted = false;
    };
  }, [product.id, user.id]);

  const continueToCheckout = async () => {
    setValidating(true);
    setError("");
    try {
      const result = await validatePromotionCode(product.id, user.id, code);
      setApplied({
        code: result.code,
        label: result.label,
        discountInCent: result.discountInCent,
      });
      setCheckoutReady(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "This promotion code could not be applied.",
      );
    } finally {
      setValidating(false);
    }
  };

  if (!checkoutReady) {
    return (
      <Card className="mx-auto max-w-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/[0.12] to-violet-500/[0.08] p-6 sm:p-8">
          <Badge variant="outline" className="mb-3 border-primary/20 bg-background/70 text-primary">
            Secure checkout
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Ready to continue?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a promotion code if you have one, or continue without a code.
          </p>
        </div>
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="space-y-2">
            <span className="text-sm font-medium">Available coupons</span>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-between rounded-xl px-4 font-normal"
                >
                  <span className="truncate text-left">
                    {code
                      ? `Selected: ${code}`
                      : loadingPromotions
                        ? "Loading available coupons..."
                        : availablePromotions.length > 0
                          ? "Browse or search coupons"
                          : "No public coupons available right now"}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
              >
                <Command>
                  <CommandInput placeholder="Search coupon code..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingPromotions
                        ? "Loading coupons..."
                        : "No coupon matched your search."}
                    </CommandEmpty>
                    <CommandGroup>
                      {availablePromotions.map((promotion) => (
                        <CommandItem
                          key={promotion.code}
                          value={`${promotion.code} ${promotion.label}`}
                          onSelect={() => {
                            setCode(promotion.code);
                            setError("");
                            setPickerOpen(false);
                          }}
                          className="cursor-pointer rounded-lg border border-transparent px-3 py-3 data-[selected=true]:border-primary/20 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary aria-selected:border-primary/20 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              code === promotion.code
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm font-semibold uppercase">
                              {promotion.code}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {promotion.label}
                              {promotion.discountInCent > 0
                                ? ` · saves up to $${(
                                    promotion.discountInCent / 100
                                  ).toFixed(2)}`
                                : ""}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <label className="space-y-2 text-sm font-medium">
            <span>
              Promotion code{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </span>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase().replace(/\s/g, ""));
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void continueToCheckout();
                }}
                placeholder="Type a code or choose one above"
                className="h-12 pl-10 font-mono uppercase"
              />
            </div>
            <span className="block text-xs text-muted-foreground">
              Pick a coupon from the list, or type one if you already know it.
            </span>
          </label>
          {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
          <Button className="h-12 w-full" onClick={continueToCheckout} disabled={validating}>
            {validating ? "Checking…" : code ? "Apply code & continue" : "Continue to checkout"}
            {!validating && <ArrowRight className="size-4" />}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applied?.code && (
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">{applied.code} applied</p>
            <p className="text-sm">
              {applied.label}
              {applied.discountInCent != null && applied.discountInCent > 0
                ? ` · saves $${(applied.discountInCent / 100).toFixed(2)}`
                : ""}
            </p>
          </div>
        </div>
      )}
      <EmbeddedCheckoutProvider
        stripe={stripeClientPromise}
        options={{
          fetchClientSecret: getClientSessionSecret.bind(
            null,
            product,
            user,
            applied?.code ?? "",
          ),
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
