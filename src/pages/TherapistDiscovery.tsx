
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Star, Heart, MapPin, Clock, Check, Briefcase, Users } from 'lucide-react';
import RootLayout from '@/components/layout/RootLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { therapistDiscoveryService } from '@/services/therapistDiscoveryService';
import { Therapist } from '@/types/therapist';

const TherapistDiscovery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);
  const [activeFilters, setActiveFilters] = useState({
    acceptingNewClients: false,
    offersVirtual: false,
    youngTherapists: false,
  });

  // Fetch all therapists
  const { data: therapists, isLoading, error } = useQuery({
    queryKey: ['therapists'],
    queryFn: therapistDiscoveryService.getAllTherapists,
  });

  // Apply filters and search
  useEffect(() => {
    if (!therapists) return;

    let results = [...therapists];

    // Apply search
    if (searchQuery) {
      results = results.filter(
        (therapist) =>
          therapist.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          therapist.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          therapist.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
          therapist.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (activeFilters.acceptingNewClients) {
      results = results.filter((t) => t.acceptingNewClients);
    }

    if (activeFilters.offersVirtual) {
      results = results.filter((t) => t.offersVirtual);
    }

    if (activeFilters.youngTherapists) {
      results = results.filter((t) => t.age < 35);
    }

    setFilteredTherapists(results);
  }, [therapists, searchQuery, activeFilters]);

  const toggleFilter = (filter: keyof typeof activeFilters) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      acceptingNewClients: false,
      offersVirtual: false,
      youngTherapists: false,
    });
    setSearchQuery('');
  };

  return (
    <RootLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Find Your Therapist</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with therapists who understand your needs and can provide the support you deserve.
          </p>

          {/* Search and filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, specialty, or location"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="md:w-auto" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge
                variant={activeFilters.acceptingNewClients ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('acceptingNewClients')}
              >
                Accepting Clients
              </Badge>
              <Badge
                variant={activeFilters.offersVirtual ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('offersVirtual')}
              >
                Virtual Sessions
              </Badge>
              <Badge
                variant={activeFilters.youngTherapists ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('youngTherapists')}
              >
                Younger Therapists
              </Badge>
            </div>
          </div>

          {/* Results */}
          <div>
            <Tabs defaultValue="grid" className="mb-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {filteredTherapists?.length || 0} therapists found
                </p>
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="grid" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">Loading therapists...</div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">Error loading therapists</div>
                ) : filteredTherapists?.length === 0 ? (
                  <div className="text-center py-12">No therapists found matching your criteria</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTherapists.map((therapist) => (
                      <Card key={therapist.id} className="overflow-hidden h-full flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <img
                                src={therapist.profileImage}
                                alt={`${therapist.firstName} ${therapist.lastName}`}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              <div>
                                <CardTitle className="text-lg">
                                  {therapist.firstName} {therapist.lastName}
                                </CardTitle>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3.5 w-3.5 mr-1" />
                                  {therapist.location}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Star className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm ml-1">{therapist.rating}</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1">
                          <div className="flex flex-wrap gap-1 mb-3">
                            {therapist.specialties.slice(0, 3).map((specialty) => (
                              <Badge key={specialty} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{therapist.bio}</p>
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Briefcase className="h-3.5 w-3.5 mr-1" />
                              {therapist.yearsOfExperience} yrs
                            </span>
                            <span className="flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              {therapist.age} years old
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-2 pb-4 flex justify-between items-center border-t">
                          <div className="flex gap-2">
                            {therapist.acceptingNewClients && (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Accepting
                              </Badge>
                            )}
                            {therapist.offersVirtual && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                Virtual
                              </Badge>
                            )}
                          </div>
                          <Button size="sm">Connect</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">Loading therapists...</div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">Error loading therapists</div>
                ) : filteredTherapists?.length === 0 ? (
                  <div className="text-center py-12">No therapists found matching your criteria</div>
                ) : (
                  <div className="space-y-4">
                    {filteredTherapists.map((therapist) => (
                      <Card key={therapist.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-4 md:w-1/4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r">
                            <img
                              src={therapist.profileImage}
                              alt={`${therapist.firstName} ${therapist.lastName}`}
                              className="w-24 h-24 rounded-full object-cover mb-3"
                            />
                            <h3 className="font-semibold text-center">
                              {therapist.firstName} {therapist.lastName}
                            </h3>
                            <div className="flex items-center mt-1">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm ml-1">{therapist.rating}</span>
                            </div>
                            <p className="text-sm text-gray-500 flex items-center mt-1 text-center">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {therapist.location}
                            </p>
                          </div>

                          <div className="p-4 md:w-3/4">
                            <div className="flex flex-wrap gap-1 mb-3">
                              {therapist.specialties.map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{therapist.bio}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                              <span className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {therapist.yearsOfExperience} years experience
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {therapist.age} years old
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {therapist.acceptingNewClients ? 'Accepting clients' : 'Not accepting clients'}
                              </span>
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-medium">Insurance:</span>{' '}
                                {therapist.insuranceAccepted.join(', ')}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Heart className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button size="sm">Connect</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </RootLayout>
  );
};

export default TherapistDiscovery;
