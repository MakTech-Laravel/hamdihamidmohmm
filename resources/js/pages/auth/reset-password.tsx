import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t } = useLocale();

    return (
        <AuthLayout
            title={t('auth.reset_password')}
            description={t('auth.reset_password_description')}
        >
            <Head title={t('auth.reset_password')} />

            <div className="mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                <Form
                    {...update.form()}
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                >
                    {({ processing, errors }) => (
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                                    readOnly
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('auth.new_password')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="••••••••"
                                    className="bg-background/50"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    {t('auth.confirm_password')}
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="bg-background/50"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-violet-600 hover:bg-violet-700 shadow-lg"
                                disabled={processing}
                                data-test="reset-password-button"
                            >
                                {processing && <Spinner className="mr-2 h-4 w-4" />}
                                {t('auth.reset_password')}
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
