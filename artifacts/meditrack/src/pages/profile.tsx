import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { PageTitle } from '@/components/shell';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(50),
  age: z.coerce.number({ invalid_type_error: 'Please enter your age' }).int('Whole numbers only').min(1, 'Please enter a valid age').max(120, 'Please enter a valid age'),
});
type V = z.infer<typeof schema>;

export default function Profile() {
  const { profile, saveProfile } = useStore();
  const { toast } = useToast();
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: profile });
  return (
    <div className="max-w-xl">
      <PageTitle eyebrow="About you" title="Profile" />
      <Form {...form}>
        <form className="rise rounded-3xl bg-card border p-6 md:p-8 flex flex-col gap-5"
          onSubmit={form.handleSubmit((v) => { if (saveProfile(v)) { toast({ title: 'Profile saved' }); form.reset(v); } })}>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel className="text-base font-bold">Your name</FormLabel>
              <FormControl><Input {...field} className="h-12 text-lg rounded-xl bg-background" data-testid="input-profile-name" /></FormControl>
              <FormMessage className="text-base" /></FormItem>
          )} />
          <FormField control={form.control} name="age" render={({ field }) => (
            <FormItem><FormLabel className="text-base font-bold">Your age</FormLabel>
              <FormControl><Input {...field} type="number" inputMode="numeric" className="h-12 text-lg rounded-xl bg-background w-40" data-testid="input-profile-age" /></FormControl>
              <FormMessage className="text-base" /></FormItem>
          )} />
          <button type="submit" disabled={!form.formState.isDirty} className="self-start rounded-full bg-primary text-primary-foreground px-7 py-3 text-lg font-bold disabled:opacity-50 transition-opacity" data-testid="button-save-profile">Save profile</button>
        </form>
      </Form>
      <p className="mt-6 flex gap-2 text-base text-muted-foreground"><Lock className="size-5 shrink-0 mt-0.5" /> Everything stays in this browser on this device. Clearing your browser data will erase it.</p>
    </div>
  );
}
