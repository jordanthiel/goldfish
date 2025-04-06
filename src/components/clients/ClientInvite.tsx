
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { invitationService } from '@/services/invitationService';
import { Client } from '@/services/clientService';

const inviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface ClientInviteProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent?: () => void;
}

const ClientInvite = ({ client, open, onOpenChange, onInviteSent }: ClientInviteProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: client.email || '',
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    setIsSubmitting(true);
    try {
      // Create the invitation
      const invitation = await invitationService.createInvitation(
        client.id,
        values.email
      );

      // Send the invitation email
      await invitationService.sendInvitationEmail(invitation.id);

      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${values.email}`,
      });

      if (onInviteSent) {
        onInviteSent();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error sending invitation',
        description: error.message || 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Client</DialogTitle>
          <DialogDescription>
            Send an invitation to {client.first_name} {client.last_name} to join the platform.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="client@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientInvite;
