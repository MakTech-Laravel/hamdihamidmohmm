import { Form, Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FrontendLayout from '@/layouts/frontend-layout';
import { jobs } from '@/routes';

type Props = {
    minAmount: number;
    defaultAmount: number;
};

export default function YallaPayCheckout({
    minAmount,
    defaultAmount,
}: Props) {
    return (
        <FrontendLayout>
            <Head title="YallaPay Checkout" />

            <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
                <p className="text-sm font-medium text-[#0b57d0]">YallaPay</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    Sandbox checkout
                </h1>
                <p className="mt-2 text-sm text-[#5b6475]">
                    Test a one-time payment in YallaPay sandbox. Minimum amount
                    is {minAmount.toLocaleString()} SDG.
                </p>

                <Form
                    action="/checkout/yallapay"
                    method="post"
                    className="mt-8 space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (SDG)</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    min={minAmount}
                                    defaultValue={defaultAmount}
                                    required
                                />
                                {errors.amount && (
                                    <p className="text-sm text-red-600">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    type="text"
                                    defaultValue="Test order"
                                />
                            </div>

                            {errors.payment && (
                                <p className="text-sm text-red-600">
                                    {errors.payment}
                                </p>
                            )}

                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? 'Redirecting…'
                                    : 'Pay with YallaPay'}
                            </Button>
                        </>
                    )}
                </Form>

                <Link
                    href={jobs()}
                    className="mt-6 text-sm text-[#0b57d0] hover:underline"
                >
                    Back to home
                </Link>
            </section>
        </FrontendLayout>
    );
}
