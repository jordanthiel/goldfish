
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Plus, Search } from 'lucide-react';

// Mock data for insurance claims
const mockClaims = [
  {
    id: "CLM001",
    patientName: "John Doe",
    insuranceProvider: "Blue Cross",
    serviceDate: "2023-09-15",
    amount: 150,
    status: "Approved",
    submittedDate: "2023-09-16",
  },
  {
    id: "CLM002",
    patientName: "Sarah Johnson",
    insuranceProvider: "Aetna",
    serviceDate: "2023-09-20",
    amount: 125,
    status: "Pending",
    submittedDate: "2023-09-21",
  },
  {
    id: "CLM003",
    patientName: "Michael Davis",
    insuranceProvider: "UnitedHealth",
    serviceDate: "2023-09-18",
    amount: 200,
    status: "Rejected",
    submittedDate: "2023-09-19",
  },
  {
    id: "CLM004",
    patientName: "Emma Wilson",
    insuranceProvider: "Cigna",
    serviceDate: "2023-09-22",
    amount: 175,
    status: "Pending",
    submittedDate: "2023-09-23",
  },
  {
    id: "CLM005",
    patientName: "Daniel Brown",
    insuranceProvider: "Humana",
    serviceDate: "2023-09-25",
    amount: 150,
    status: "Approved",
    submittedDate: "2023-09-26",
  },
];

const InsuranceClaims = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter claims based on search term and status filter
  const filteredClaims = mockClaims.filter(claim => {
    const matchesSearch = 
      claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insuranceProvider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      claim.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats for the summary cards
  const totalClaims = mockClaims.length;
  const pendingClaims = mockClaims.filter(claim => claim.status === 'Pending').length;
  const approvedClaims = mockClaims.filter(claim => claim.status === 'Approved').length;
  const rejectedClaims = mockClaims.filter(claim => claim.status === 'Rejected').length;
  
  // Calculate total amount for approved claims
  const totalReimbursed = mockClaims
    .filter(claim => claim.status === 'Approved')
    .reduce((total, claim) => total + claim.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Insurance Claims</h2>
        <p className="text-muted-foreground">Manage and track insurance claims for your clients.</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-5 w-5 text-therapy-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
            <p className="text-xs text-muted-foreground">All submitted claims</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedClaims}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Reimbursed</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReimbursed}</div>
            <p className="text-xs text-muted-foreground">Total amount reimbursed</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search claims..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button className="md:w-40">
          <Plus className="mr-2 h-4 w-4" />
          New Claim
        </Button>
      </div>
      
      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>List of insurance claims</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Insurance Provider</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.id}</TableCell>
                  <TableCell>{claim.patientName}</TableCell>
                  <TableCell>{claim.insuranceProvider}</TableCell>
                  <TableCell>{claim.serviceDate}</TableCell>
                  <TableCell>${claim.amount}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        claim.status === "Approved" 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : claim.status === "Pending" 
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100" 
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceClaims;
