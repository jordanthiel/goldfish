
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, FileX, Clock, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for insurance claims
const mockClaims = [
  {
    id: "CLM-1234",
    patientName: "Jane Smith",
    insuranceProvider: "Blue Shield",
    service: "Therapy Session - 45 min",
    date: "2025-03-28",
    amount: 120.00,
    status: "approved",
    submittedDate: "2025-03-30",
  },
  {
    id: "CLM-1235",
    patientName: "John Doe",
    insuranceProvider: "Aetna",
    service: "Initial Assessment",
    date: "2025-04-01",
    amount: 180.00,
    status: "pending",
    submittedDate: "2025-04-02",
  },
  {
    id: "CLM-1236",
    patientName: "Michael Davis",
    insuranceProvider: "United Healthcare",
    service: "Therapy Session - 60 min",
    date: "2025-03-25",
    amount: 150.00,
    status: "rejected",
    submittedDate: "2025-03-27",
    rejectionReason: "Invalid service code",
  },
  {
    id: "CLM-1237",
    patientName: "Sarah Johnson",
    insuranceProvider: "Cigna",
    service: "Group Therapy",
    date: "2025-04-02",
    amount: 90.00,
    status: "draft",
    lastUpdated: "2025-04-03",
  },
  {
    id: "CLM-1238",
    patientName: "Jane Smith",
    insuranceProvider: "Blue Shield",
    service: "Therapy Session - 45 min",
    date: "2025-04-04",
    amount: 120.00,
    status: "pending",
    submittedDate: "2025-04-05",
  },
];

const InsuranceClaims = () => {
  const [filter, setFilter] = useState('all');

  const filteredClaims = filter === 'all' 
    ? mockClaims 
    : mockClaims.filter(claim => claim.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <FileCheck className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <FileX className="h-5 w-5 text-red-600" />;
      case 'draft':
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  // Calculate claim statistics
  const claimsStats = {
    total: mockClaims.length,
    approved: mockClaims.filter(c => c.status === 'approved').length,
    pending: mockClaims.filter(c => c.status === 'pending').length,
    rejected: mockClaims.filter(c => c.status === 'rejected').length,
    totalAmount: mockClaims.reduce((sum, claim) => sum + claim.amount, 0).toFixed(2),
    approvedAmount: mockClaims
      .filter(c => c.status === 'approved')
      .reduce((sum, claim) => sum + claim.amount, 0)
      .toFixed(2),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Insurance Claims</h2>
        <p className="text-muted-foreground">Manage your patient insurance claims and track their status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <div className="h-5 w-5 text-therapy-purple">{claimsStats.total}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsStats.total}</div>
            <p className="text-xs text-muted-foreground">All claims</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <FileCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsStats.approved}</div>
            <p className="text-xs text-muted-foreground">${claimsStats.approvedAmount} reimbursed</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <FileX className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsStats.rejected}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Recent Claims</CardTitle>
              <CardDescription>
                View and manage your insurance claims
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filter === 'all' ? "default" : "outline"} 
                onClick={() => setFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button 
                variant={filter === 'pending' ? "default" : "outline"} 
                onClick={() => setFilter('pending')}
                size="sm"
              >
                Pending
              </Button>
              <Button 
                variant={filter === 'approved' ? "default" : "outline"} 
                onClick={() => setFilter('approved')}
                size="sm"
              >
                Approved
              </Button>
              <Button 
                variant={filter === 'rejected' ? "default" : "outline"} 
                onClick={() => setFilter('rejected')}
                size="sm"
                className="text-red-600"
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
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
                  <TableCell>{claim.service}</TableCell>
                  <TableCell>{new Date(claim.date).toLocaleDateString()}</TableCell>
                  <TableCell>${claim.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(claim.status)}
                      {getStatusBadge(claim.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                    {claim.status === 'draft' && (
                      <Button variant="ghost" size="sm">Submit</Button>
                    )}
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
