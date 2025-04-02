
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Camera, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Form schema for personal information
const personalInfoSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  dateOfBirth: z.string(),
});

// Form schema for emergency contact
const emergencyContactSchema = z.object({
  emergencyName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  emergencyRelation: z.string().min(2, { message: "Relationship is required." }),
  emergencyPhone: z.string().min(10, { message: "Please enter a valid phone number." }),
});

// Form schema for profile questionnaire
const questionnaireSchema = z.object({
  reasonForTherapy: z.string().min(2, { message: "This field is required." }),
  previousTherapy: z.string(),
  medicalConditions: z.string(),
  medications: z.string(),
  therapyGoals: z.string().min(2, { message: "This field is required." }),
});

const PatientProfile = () => {
  const [activeTab, setActiveTab] = React.useState('personal-info');
  const { toast } = useToast();
  
  // Personal info form
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: "Michael Davis",
      email: "michael.davis@example.com",
      phone: "(555) 123-4567",
      address: "789 Pine Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94110",
      dateOfBirth: "1990-05-15",
    },
  });

  // Emergency contact form
  const emergencyContactForm = useForm<z.infer<typeof emergencyContactSchema>>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      emergencyName: "Sarah Davis",
      emergencyRelation: "Spouse",
      emergencyPhone: "(555) 987-6543",
    },
  });

  // Questionnaire form
  const questionnaireForm = useForm<z.infer<typeof questionnaireSchema>>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      reasonForTherapy: "Anxiety and work-related stress",
      previousTherapy: "None",
      medicalConditions: "None",
      medications: "None",
      therapyGoals: "Develop better coping mechanisms for stress and improve work-life balance.",
    },
  });

  // Form submission handlers
  function onPersonalInfoSubmit(values: z.infer<typeof personalInfoSchema>) {
    console.log(values);
    toast({
      title: "Profile updated",
      description: "Your personal information has been updated successfully.",
    });
  }

  function onEmergencyContactSubmit(values: z.infer<typeof emergencyContactSchema>) {
    console.log(values);
    toast({
      title: "Emergency contact updated",
      description: "Your emergency contact information has been updated successfully.",
    });
  }

  function onQuestionnaireSubmit(values: z.infer<typeof questionnaireSchema>) {
    console.log(values);
    toast({
      title: "Questionnaire saved",
      description: "Your responses have been saved successfully.",
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and therapy preferences.
            </p>
          </div>
          
          <Separator />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personal-info">Personal Information</TabsTrigger>
              <TabsTrigger value="emergency-contact">Emergency Contact</TabsTrigger>
              <TabsTrigger value="questionnaire">Therapy Questionnaire</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal-info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    This is the photo your therapist will see.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder.svg" alt="Profile Picture" />
                      <AvatarFallback className="bg-therapy-purple text-white text-xl">MD</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" className="mb-2">
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Square image recommended, JPG or PNG format.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details. This information is kept confidential.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...personalInfoForm}>
                    <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={personalInfoForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormDescription>
                                This will be used for appointment notifications.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={personalInfoForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="CA">California</SelectItem>
                                    <SelectItem value="NY">New York</SelectItem>
                                    <SelectItem value="TX">Texas</SelectItem>
                                    <SelectItem value="WA">Washington</SelectItem>
                                    <SelectItem value="FL">Florida</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={personalInfoForm.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zip Code</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="emergency-contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>
                    This person will be contacted in case of emergency. Please ensure the information is up to date.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...emergencyContactForm}>
                    <form onSubmit={emergencyContactForm.handleSubmit(onEmergencyContactSubmit)} className="space-y-6">
                      <FormField
                        control={emergencyContactForm.control}
                        name="emergencyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emergencyContactForm.control}
                        name="emergencyRelation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Partner">Partner</SelectItem>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                                <SelectItem value="Friend">Friend</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emergencyContactForm.control}
                        name="emergencyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Save Emergency Contact
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="questionnaire" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Therapy Questionnaire</CardTitle>
                  <CardDescription>
                    This information helps your therapist understand your needs better.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...questionnaireForm}>
                    <form onSubmit={questionnaireForm.handleSubmit(onQuestionnaireSubmit)} className="space-y-6">
                      <FormField
                        control={questionnaireForm.control}
                        name="reasonForTherapy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What brings you to therapy?</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3}
                                placeholder="Please describe the main reasons you're seeking therapy"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={questionnaireForm.control}
                        name="previousTherapy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Have you been in therapy before? If yes, please describe.</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3}
                                placeholder="Include when, for how long, and what was helpful or unhelpful"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={questionnaireForm.control}
                        name="medicalConditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Do you have any medical conditions your therapist should know about?</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3}
                                placeholder="Please list any relevant medical conditions"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={questionnaireForm.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Are you currently taking any medications?</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3}
                                placeholder="Please list any medications you're currently taking"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={questionnaireForm.control}
                        name="therapyGoals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What are your goals for therapy?</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3}
                                placeholder="What would you like to achieve through therapy?"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Save Responses
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientProfile;
