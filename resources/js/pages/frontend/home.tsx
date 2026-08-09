import { Head } from '@inertiajs/react';
import FrontendLayout from '@/layouts/frontend-layout';

export default function Home() {
    return (
        <FrontendLayout>
            <Head title="Home Page" />
            <div className="flex items-center justify-center py-24">
                <h1 className="text-3xl font-semibold">Frontend</h1>
            </div>
        </FrontendLayout>
    );
}
