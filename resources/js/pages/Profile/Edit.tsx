import { useForm } from '@inertiajs/react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { UserHeader } from '@/layouts/partials/user/header';
import { type User } from '@/types';


interface Props {
    user: User;
}

export default function EditProfile({ user }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        avatar: null as File | null,
        password: '',
        password_confirmation: '',
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const getInitials = useInitials();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('user-profile.update'), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Profile updated successfully!');
                setData('password', '');
                setData('password_confirmation', '');
            },
            onError: () => {
                toast.error('Failed to update profile. Please try again.');
            },
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <UserHeader />
            <main className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                        <CardDescription>Update your profile information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage
                                            src={previewUrl || user.avatar_url || user.avatar}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="bg-violet-600 text-white text-2xl">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Label
                                        htmlFor="avatar"
                                        className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </Label>
                                    <Input
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Profile Picture</p>
                                    <p className="text-xs text-muted-foreground">Click the camera icon to upload</p>
                                </div>
                                {errors.avatar && (
                                    <p className="text-sm text-red-500">{errors.avatar}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-4 border-t pt-6">
                                <h3 className="text-lg font-medium">Change Password</h3>
                                <p className="text-sm text-muted-foreground">Leave blank if you don't want to change your password</p>

                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            autoComplete="new-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            autoComplete="new-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPasswordConfirmation ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" disabled={processing}>
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
