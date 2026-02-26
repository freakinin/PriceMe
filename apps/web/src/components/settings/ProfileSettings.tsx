import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2, Mail, Calendar } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type UpdateNameValues = z.infer<typeof updateProfileSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ProfileSettings() {
  const { toast } = useToast();
  const {
    profile,
    isLoading,
    updateName,
    isUpdatingName,
    changePassword,
    isChangingPassword,
  } = useProfile();

  // --- Name form ---
  const nameForm = useForm<UpdateNameValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (profile) {
      nameForm.reset({ name: profile.name ?? '' });
    }
  }, [profile, nameForm]);

  const onSaveName = async (data: UpdateNameValues) => {
    try {
      await updateName(data.name!);
      // Keep localStorage in sync so useAuth reflects the new name in the current session
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, name: data.name }));
      }
      toast({ variant: 'success', title: 'Display name updated' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update name' });
    }
  };

  // --- Password form ---
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onChangePassword = async (data: ChangePasswordValues) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      toast({ variant: 'success', title: 'Password changed', description: 'Your password has been updated.' });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Failed to change password';
      if (msg.toLowerCase().includes('current password')) {
        passwordForm.setError('currentPassword', { message: msg });
      } else {
        toast({ variant: 'destructive', title: msg });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-8">

        {/* Section 1: Account Info (read-only) */}
        <div>
          <h2 className="text-base font-semibold mb-0.5">Account</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your account details. Email cannot be changed.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground w-24">Email</span>
              <span className="font-medium">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground w-24">Member since</span>
              <span className="font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 2: Display Name */}
        <div>
          <h2 className="text-base font-semibold mb-0.5">Display Name</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Used to personalise your experience within PriceMe.
          </p>
          <Form {...nameForm}>
            <form onSubmit={nameForm.handleSubmit(onSaveName)} className="max-w-sm space-y-4">
              <FormField
                control={nameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="secondary" disabled={isUpdatingName}>
                {isUpdatingName ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Name</>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <Separator />

        {/* Section 3: Change Password */}
        <div>
          <h2 className="text-base font-semibold mb-0.5">Change Password</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Update your password. You must provide your current password to confirm.
          </p>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="max-w-sm space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min. 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="secondary" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Change Password</>
                )}
              </Button>
            </form>
          </Form>
        </div>

      </div>
    </div>
  );
}
