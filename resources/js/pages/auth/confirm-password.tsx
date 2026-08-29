import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    const { t } = useLocale();

    return (
        <AuthLayout
            title={t('auth.confirm_password_title')}
            description={t('auth.confirm_password_description')}
        >
            <Head title={t('auth.confirm_password')} />

            <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-violet-500/10 p-3">
                        <ShieldCheck className="h-6 w-6 text-violet-600" />
                    </div>
                </div>

                <Form {...store.form()} resetOnSuccess={['password']}>
                    {({ processing, errors }) => (
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('auth.password')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    autoFocus
                                    className="bg-background/50"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                className="w-full bg-violet-600 hover:bg-violet-700 shadow-md"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner className="mr-2 h-4 w-4" />}
                                {t('auth.confirm_password_button')}
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
