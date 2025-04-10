import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter 
} from '@/components/ui/sheet';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { clientService } from '@/services/clientService';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Mail, Search, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const clientSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Please enter a valid email' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergency_contact: z.string().optional().or(z.literal('')),
  status: z.string().default('Active'),
  date_of_birth: z.string().optional().or(z.literal('')),
  user_id: z.string().optional().or(z.literal('')),
  send_invitation: z.boolean().default(true),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  onClientSaved: () => void;
}

const ClientForm = ({ open, onOpenChange, client, onClientSaved }: ClientFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [emailToSearch, setEmailToSearch] = useState('');

  const defaultValues = client ? {
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    emergency_contact: client.emergency_contact || '',
    status: client.status || 'Active',
    date_of_birth: client.date_of_birth || '',
    user_id: client.user_id || '',
    send_invitation: true,
  } : {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact: '',
    status: 'Active',
    date_of_birth: '',
    user_id: '',
    send_invitation: true,
  };

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  const emailValue = form.watch('email');
  const sendInvitation = form.watch('send_invitation');

  const handleEmailSearch = async () => {
    if (!emailToSearch) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email to search',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSearching(true);
      const result = await clientService.searchUserByEmail(emailToSearch);
      setSearchResults(result);
      
      if (result.exists && result.user) {
        // Pre-fill the form with the user's data
        form.setValue('first_name', result.user.first_name);
        form.setValue('last_name', result.user.last_name);
        form.setValue('email', result.user.email);
        form.setValue('phone', result.user.phone || '');
        form.setValue('address', result.user.address || '');
        form.setValue('emergency_contact', result.user.emergency_contact || '');
        
        toast({
          title: 'User Found',
          description: `Found existing user: ${result.user.first_name} ${result.user.last_name}`,
        });
      } else {
        // Clear form and leave only email
        form.setValue('first_name', '');
        form.setValue('last_name', '');
        form.setValue('phone', '');
        form.setValue('address', '');
        form.setValue('emergency_contact', '');
        
        toast({
          title: 'User Not Found',
          description: 'No existing user found with this email. Please fill in the details.',
        });
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to search for user',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (values: ClientFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      if (client?.id) {
        // Update existing client
        await clientService.updateClient(client.id, values);
        
        toast({
          title: 'Client updated',
          description: `${values.first_name} ${values.last_name}'s information has been updated.`,
        });
        
        // If email was added or changed and send_invitation is true, send invitation
        if (values.email && values.email !== client.email && values.send_invitation) {
          try {
            const result = await clientService.sendClientInvitationById(client.id, values.email);
            if (result.success) {
              toast({
                title: 'Invitation sent',
                description: `An invitation email has been sent to ${values.email}.`,
              });
            } else {
              toast({
                title: 'Error sending invitation',
                description: result.message || 'Failed to send invitation email.',
                variant: 'destructive',
              });
            }
          } catch (inviteError: any) {
            toast({
              title: 'Error sending invitation',
              description: inviteError.message || 'Failed to send invitation email.',
              variant: 'destructive',
            });
          }
        }
      } else {
        // Add new client - ensure first_name and last_name are set
        const clientData = {
          ...values,
          first_name: values.first_name,
          last_name: values.last_name,
          user_id: user.id  // Set the current user as the therapist ID
        };
        
        // When creating a new client, the invitation is sent automatically if email is provided
        const newClient = await clientService.createClient(clientData);
        
        toast({
          title: 'Client added',
          description: `${values.first_name} ${values.last_name} has been added to your client list.`,
        });
        
        if (values.email && values.send_invitation && newClient) {
          try {
            const result = await clientService.sendClientInvitationById(newClient.client_id, values.email);
            if (result.success) {
              toast({
                title: 'Invitation sent',
                description: `An invitation email has been sent to ${values.email}.`,
              });
            } else {
              toast({
                title: 'Error sending invitation',
                description: result.message || 'Failed to send invitation email.',
                variant: 'destructive',
              });
            }
          } catch (inviteError: any) {
            toast({
              title: 'Error sending invitation',
              description: inviteError.message || 'Failed to send invitation email.',
              variant: 'destructive',
            });
          }
        }
      }

      form.reset(defaultValues);
      onOpenChange(false);
      onClientSaved();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{client ? 'Edit Client' : 'Add New Client'}</SheetTitle>
          <SheetDescription>
            {client 
              ? 'Update your client\'s information in the form below.' 
              : 'Fill in the details to add a new client to your practice.'}
          </SheetDescription>
        </SheetHeader>
        
        {!client && (
          <div className="py-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Search for Existing User</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search by email"
                  value={emailToSearch}
                  onChange={(e) => setEmailToSearch(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleEmailSearch}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {searchResults && (
                <div className="mt-2">
                  {searchResults.exists ? (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                      <User className="h-4 w-4" />
                      <AlertTitle>User found</AlertTitle>
                      <AlertDescription>
                        User details have been filled in. You can modify them before saving.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>New User</AlertTitle>
                      <AlertDescription>
                        No existing user found with this email. Please fill in their details.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      {...field} 
                      value={field.value || ''} 
                      onChange={(e) => {
                        field.onChange(e);
                        setEmailToSearch(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {emailValue && (
              <FormField
                control={form.control}
                name="send_invitation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Send client invitation email
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This will allow the client to create an account and access their portal.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            {emailValue && sendInvitation && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  An invitation will be sent to {emailValue}. The client will be able to create an account and access their portal.
                </AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main St, City, State, Zip" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emergency_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Name: (555) 987-6543" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <SheetFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default ClientForm;
