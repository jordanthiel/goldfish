
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { roleService } from '@/services/roleService';
import { toast } from '@/hooks/use-toast';

export const UserRoleManager = () => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('therapist');
  const [loading, setLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await roleService.assignRole(userId, role);
      toast({
        title: "Success",
        description: `Role '${role}' assigned to user successfully.`,
      });
      setUserId('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Manage User Roles</CardTitle>
        <CardDescription>
          Add or update roles for existing users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <Input 
            id="userId"
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="Enter user UUID" 
          />
          <p className="text-xs text-muted-foreground">
            Enter the UUID of the user you want to assign a role to
          </p>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <RadioGroup
            value={role}
            onValueChange={setRole}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="therapist" id="therapist" />
              <Label htmlFor="therapist" className="cursor-pointer">Therapist</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="client" id="client" />
              <Label htmlFor="client" className="cursor-pointer">Client</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAssignRole} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Assigning...' : 'Assign Role'}
        </Button>
      </CardFooter>
    </Card>
  );
};
