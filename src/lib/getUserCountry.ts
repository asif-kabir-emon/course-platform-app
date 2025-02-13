"use server";
import { pppCoupons } from "@/data/pppCoupons";
import { headers } from "next/headers";

const COUNTRY_HEADER_KEY = "x-user-country";

const getUserCountry = async () => {
  const head = await headers();

  return head.get(COUNTRY_HEADER_KEY);
};

export const getUserCoupon = async () => {
  const country = await getUserCountry();
  console.log(country);

  if (country === null || country === undefined) return;

  const coupon = pppCoupons.find((coupon) =>
    coupon.countryCodes.includes(country),
  );

  if (coupon === null || coupon === undefined) return;

  return {
    stripeCouponId: coupon.stripeCouponId,
    discountPercentage: coupon.discountPercentage,
  };
};
