import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { CreditCard, DollarSign, Download, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import RootLayout from '@/components/layout/RootLayout';

// Form schema for adding payment method
const paymentMethodSchema = z.object({
  cardNumber: z.string().min(16, { message: "Card number must be at least 16 digits." }),
  cardName: z.string().min(2, { message: "Cardholder name is required." }),
  expiryDate: z.string().min(5, { message: "Expiry date is required." }),
  cvv: z.string().min(3, { message: "CVV is required." }),
});

// Form schema for invoice settings
const invoiceSettingsSchema = z.object({
  businessName: z.string().min(2, { message: "Business name is required." }),
  businessAddress: z.string().min(5, { message: "Business address is required." }),
  taxId: z.string().optional(),
  defaultRate: z.string().min(1, { message: "Default hourly rate is required." }),
  currency: z.string().min(1, { message: "Currency is required." }),
});

const TherapistBilling = () => {
  const [activeTab, setActiveTab] = React.useState('billing');
  const [billingTab, setBillingTab] = React.useState('payment-methods');
  const { toast } = useToast();
  
  // Payment method form
  const paymentMethodForm = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
    },
  });

  // Invoice settings form
  const invoiceSettingsForm = useForm<z.infer<typeof invoiceSettingsSchema>>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      businessName: "Dr. Amy Johnson Psychology",
      businessAddress: "123 Therapy Street, Suite 101, San Francisco, CA 94110",
      taxId: "12-3456789",
      defaultRate: "150",
      currency: "USD",
    },
  });

  // Mock payment methods data
  const paymentMethods = [
    { 
      id: 1, 
      type: "Visa", 
      last4: "4242", 
      expiry: "05/25", 
      default: true 
    },
    { 
      id: 2, 
      type: "Mastercard", 
      last4: "8888", 
      expiry: "12/24", 
      default: false 
    }
  ];

  // Mock invoices data
  const invoices = [
    { 
      id: "INV-001", 
      date: "2023-09-15", 
      client: "John Smith", 
      amount: "$150.00", 
      status: "Paid" 
    },
    { 
      id: "INV-002", 
      date: "2023-09-10", 
      client: "Sarah Johnson", 
      amount: "$200.00", 
      status: "Paid" 
    },
    { 
      id: "INV-003", 
      date: "2023-08-28", 
      client: "Michael Brown", 
      amount: "$300.00", 
      status: "Paid" 
    },
    { 
      id: "INV-004", 
      date: "2023-08-15", 
      client: "Emily Davis", 
      amount: "$150.00", 
      status: "Paid" 
    },
    { 
      id: "INV-005", 
      date: "2023-07-29", 
      client: "David Wilson", 
      amount: "$250.00", 
      status: "Paid" 
    }
  ];

  // Payment method form submission handler
  function onPaymentMethodSubmit(values: z.infer<typeof paymentMethodSchema>) {
    console.log(values);
    toast({
      title: "Payment method added",
      description: "Your payment method has been added successfully.",
    });
    paymentMethodForm.reset();
  }

  // Invoice settings form submission handler
  function onInvoiceSettingsSubmit(values: z.infer<typeof invoiceSettingsSchema>) {
    console.log(values);
    toast({
      title: "Invoice settings updated",
      description: "Your invoice settings have been saved.",
    });
  }

  return (
    <RootLayout>
      <div className="flex-1">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
                  <p className="text-muted-foreground">
                    Manage your payment methods, invoicing settings, and transaction history.
                  </p>
                </div>
                
                <Separator />
                
                <Tabs value={billingTab} onValueChange={setBillingTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
                    <TabsTrigger value="invoice-settings">Invoice Settings</TabsTrigger>
                    <TabsTrigger value="transaction-history">Transaction History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="payment-methods" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-therapy-purple" />
                          Your Payment Methods
                        </CardTitle>
                        <CardDescription>
                          Manage your saved payment methods.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {paymentMethods.length > 0 ? (
                          <div className="space-y-4">
                            {paymentMethods.map((method) => (
                              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    <CreditCard className="h-8 w-8 text-therapy-purple" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {method.type} •••• {method.last4}
                                      {method.default && (
                                        <Badge variant="outline" className="ml-2">Default</Badge>
                                      )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>No payment methods added yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <PlusCircle className="h-5 w-5 mr-2 text-therapy-purple" />
                          Add Payment Method
                        </CardTitle>
                        <CardDescription>
                          Add a new credit or debit card.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...paymentMethodForm}>
                          <form onSubmit={paymentMethodForm.handleSubmit(onPaymentMethodSubmit)} className="space-y-6">
                            <FormField
                              control={paymentMethodForm.control}
                              name="cardNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Card Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="1234 5678 9012 3456" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentMethodForm.control}
                              name="cardName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cardholder Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Smith" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={paymentMethodForm.control}
                                name="expiryDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Expiry Date</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MM/YY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={paymentMethodForm.control}
                                name="cvv"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CVV</FormLabel>
                                    <FormControl>
                                      <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex justify-end">
                              <Button type="submit">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Card
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="invoice-settings" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-therapy-purple" />
                          Invoice Settings
                        </CardTitle>
                        <CardDescription>
                          Customize your invoice information and default settings.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...invoiceSettingsForm}>
                          <form onSubmit={invoiceSettingsForm.handleSubmit(onInvoiceSettingsSubmit)} className="space-y-6">
                            <FormField
                              control={invoiceSettingsForm.control}
                              name="businessName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={invoiceSettingsForm.control}
                              name="businessAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={invoiceSettingsForm.control}
                              name="taxId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tax ID (optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={invoiceSettingsForm.control}
                                name="defaultRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Hourly Rate</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={invoiceSettingsForm.control}
                                name="currency"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Currency</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex justify-end">
                              <Button type="submit">
                                Save Settings
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="transaction-history" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Download className="h-5 w-5 mr-2 text-therapy-purple" />
                          Invoice History
                        </CardTitle>
                        <CardDescription>
                          View and download your past invoices.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.id}</TableCell>
                                <TableCell>{invoice.date}</TableCell>
                                <TableCell>{invoice.client}</TableCell>
                                <TableCell>{invoice.amount}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={invoice.status === "Paid" ? "outline" : "secondary"}
                                    className={invoice.status === "Paid" ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" : ""}
                                  >
                                    {invoice.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4 mr-1" /> 
                                    Download
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <p className="text-sm text-muted-foreground">Showing {invoices.length} of {invoices.length} invoices</p>
                        <Button variant="outline" size="sm">
                          View All Invoices
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </RootLayout>
  );
};

export default TherapistBilling;
