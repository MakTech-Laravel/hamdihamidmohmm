import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import FrontendLayout from '@/layouts/frontend-layout';
import { jobs } from '@/routes';

type Props = {
    status: 'success' | 'failed';
    title: string;
    message: string;
};

export default function YallaPayResult({ status, title, message }: Props) {
    const isSuccess = status === 'success';

    return (
        <FrontendLayout>
            <Head title={title} />

            <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
                <p
                    className={`text-sm font-medium ${isSuccess ? 'text-emerald-700' : 'text-red-700'}`}
                >
                    YallaPay
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="mt-2 text-sm text-[#5b6475]">{message}</p>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href="/checkout/yallapay">Try again</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={jobs()}>Jobs</Link>
                    </Button>
                </div>
            </section>
        </FrontendLayout>
    );
}
