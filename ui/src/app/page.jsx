'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Building2, 
  Users, 
  Brain, 
  Target, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  ExternalLink,
  AlertCircle,
  Lightbulb,
  Table,
  Download,
  Filter,
  TrendingUp,
  MapPin,
  Calendar,
  Globe,
  Zap,
  BarChart3
} from 'lucide-react';

const IntelligentCompanyResearchAgent = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchResult, setSearchResult] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [selectedFilters, setSelectedFilters] = useState({
    minConfidence: 0,
    industry: '',
    employeeRange: ''
  });

  // Example queries for inspiration
  const exampleQueries = [
    "Find customer success professionals who use both Intercom and Klaus for quality assurance",
    "Find senior customer support managers with experience using Intercom and ZendeskQA together", 
    "Find people who have implemented or managed both Intercom customer support and Klaus quality assurance tools",
    "Find LinkedIn profiles with skills in both Intercom customer support and Klaus ZendeskQA",
    "Find customer experience professionals who mention using Intercom and Klaus in their profiles",
    "Find QA specialists who use both Intercom and Klaus for customer support quality",
    "Find support team leads who manage both Intercom chat and Klaus quality assurance",
    "Find people with Intercom and ZendeskQA certification or training"
  ];

  // Quick filter presets
  const quickFilters = [
    { label: "High Confidence (80%+)", filter: { minConfidence: 80 } },
    { label: "Medium Size (100-500)", filter: { employeeRange: "100-500" } },
    { label: "Large Companies (1000+)", filter: { employeeRange: "1000+" } },
    { label: "SaaS Only", filter: { industry: "saas" } },
    { label: "B2C Only", filter: { industry: "b2c" } }
  ];

  // Production search with real backend API
  const performIntelligentSearch = async (userQuery) => {
    setIsSearching(true);
    setSearchProgress(0);
    setSearchResult(null);

    try {
      setSearchProgress(10);

      // Make API request to production backend
      const response = await fetch('http://localhost:8000/search-companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchProgress(80);

      // Handle both companies and people results
      if (data.people) {
        // Convert people data to companies format for display compatibility
        data.companies = data.people.map(person => ({
          id: person.linkedin_url,
          name: person.name,
          industry: person.title, // Use job title as "industry"
          company_type: person.company, // Use company as "type"
          employee_count: null,
          employee_range: person.experience_indicators?.[0] || "Unknown",
          website: person.linkedin_url,
          description: person.bio_snippet,
          tools_detected: person.tools_mentioned || [],
          location: person.location,
          founded: null,
          confidence_score: person.confidence_score,
          match_reasons: person.match_reasons || [],
          search_source: person.search_source,
          additional_data: {
            person_name: person.name,
            job_title: person.title,
            company_name: person.company,
            linkedin_url: person.linkedin_url,
            is_person: true
          }
        }));
      }

      // Update state with results
      setSearchResult(data);
      setSearchProgress(100);

    } catch (error) {
      console.error('Search failed:', error);
      setSearchProgress(0);
      
      // Set error result
      setSearchResult({
        companies: [],
        people: [],
        search_summary: `Search failed: ${error.message}`,
        search_events: [
          {
            message: `❌ Error: ${error.message}`,
            type: 'error',
            timestamp: new Date().toLocaleTimeString()
          }
        ],
        criteria_matched: 0,
        total_found: 0,
        execution_time: 0,
        success: false
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    await performIntelligentSearch(query);
  };

  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery);
  };

  const handleQuickFilter = (filter) => {
    setSelectedFilters(prev => ({ ...prev, ...filter }));
  };

  const getFilteredCompanies = () => {
    if (!searchResult?.companies) return [];
    
    return searchResult.companies.filter(company => {
      // Confidence filter
      if (selectedFilters.minConfidence > 0 && company.confidence_score < selectedFilters.minConfidence) {
        return false;
      }
      
      // Industry filter
      if (selectedFilters.industry && !company.industry.toLowerCase().includes(selectedFilters.industry.toLowerCase())) {
        return false;
      }
      
      // Employee range filter
      if (selectedFilters.employeeRange) {
        const empCount = company.employee_count;
        if (selectedFilters.employeeRange === "100-500" && empCount && (empCount < 100 || empCount > 500)) {
          return false;
        }
        if (selectedFilters.employeeRange === "1000+" && empCount && empCount < 1000) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'analyzing': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'searching': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'info': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportTableData = () => {
    if (!searchResult?.table_data) return;
    
    const { columns, rows } = searchResult.table_data;
    let csvContent = columns.join(',') + '\n';
    
    rows.forEach(row => {
      const rowData = columns.map(col => `"${(row[col] || '').toString().replace(/"/g, '""')}"`);
      csvContent += rowData.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company_search_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedFilters({
      minConfidence: 0,
      industry: '',
      employeeRange: ''
    });
  };

  const filteredCompanies = getFilteredCompanies();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <Brain className="h-10 w-10 text-blue-600" />
              <Zap className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI People Finder</h1>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Find people who use specific tools and technologies. Our AI searches LinkedIn profiles 
            to discover professionals with the exact skills and experience you need.
          </p>
        </div>

        {/* Search Interface */}
        <Card className="max-w-5xl mx-auto shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Search className="h-6 w-6 text-blue-600" />
              <span>Find people who use specific tools</span>
            </CardTitle>
            <CardDescription className="text-base">
              Describe the tools, roles, or experience you're looking for and we'll find LinkedIn profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex space-x-3">
              <Textarea
                placeholder="Example: Find customer success professionals who use both Intercom and Klaus for quality assurance..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-h-[100px] text-base"
                disabled={isSearching}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="px-8 py-6 text-base"
                size="lg"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Example Queries */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Try these example searches:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleQueries.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    disabled={isSearching}
                    className="text-xs text-left justify-start h-auto py-2 px-3 whitespace-normal"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
            
            {isSearching && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm text-blue-700 font-medium">
                  <span>AI Search Progress</span>
                  <span>{searchProgress}%</span>
                </div>
                <Progress value={searchProgress} className="w-full h-2" />
                <p className="text-xs text-blue-600">
                  Analyzing criteria, searching the web, and validating company matches...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {searchResult && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Results Header and Controls */}
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <Building2 className="h-6 w-6 text-green-600" />
                        <span>Search Results</span>
                        {searchResult.companies?.length > 0 && (
                          <Badge variant="default" className="ml-2">
                            {filteredCompanies.length} companies
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        {searchResult.search_summary}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* View Toggle */}
                      {searchResult.table_data && filteredCompanies.length > 0 && (
                        <>
                          <Button
                            variant={viewMode === 'cards' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            Cards
                          </Button>
                          <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                          >
                            <Table className="h-4 w-4 mr-1" />
                            Table
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportTableData}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export CSV
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {/* Summary Stats */}
                {searchResult.companies?.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{filteredCompanies.length}</div>
                        <div className="text-sm text-blue-700">Companies Found</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{searchResult.execution_time?.toFixed(1)}s</div>
                        <div className="text-sm text-green-700">Search Time</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {filteredCompanies.length > 0 ? Math.round(filteredCompanies.reduce((acc, c) => acc + c.confidence_score, 0) / filteredCompanies.length) : 0}%
                        </div>
                        <div className="text-sm text-purple-700">Avg Match</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {filteredCompanies.filter(c => c.confidence_score >= 70).length}
                        </div>
                        <div className="text-sm text-orange-700">High Confidence</div>
                      </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          Quick Filters:
                        </p>
                        {(selectedFilters.minConfidence > 0 || selectedFilters.industry || selectedFilters.employeeRange) && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickFilters.map((filter, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFilter(filter.filter)}
                            className="text-xs"
                          >
                            {filter.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Results Display */}
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardContent className="p-6">
                  {filteredCompanies.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {searchResult.companies?.length === 0 ? 'No people found' : 'No people match your filters'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchResult.companies?.length === 0 
                        ? 'Try adjusting your search terms or using broader criteria'
                        : 'Try adjusting or clearing your filters'
                      }
                    </p>
                    {searchResult.companies?.length === 0 && (
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>💡 Tips for better results:</p>
                        <ul className="text-left max-w-md mx-auto space-y-1">
                          <li>• Try broader job titles (e.g., "customer success" instead of "senior customer success manager")</li>
                          <li>• Use common tool names (e.g., "Intercom" instead of "Intercom.io")</li>
                          <li>• Search for tool combinations (e.g., "Intercom and Klaus")</li>
                          <li>• Include job roles like "support", "customer success", "QA"</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  ) : viewMode === 'table' && searchResult.table_data ? (
                    /* Table View */
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <ScrollArea className="h-[700px]">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              {searchResult.table_data.columns.map((column, idx) => (
                                <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {searchResult.table_data.rows
                              .filter((_, idx) => filteredCompanies.map(c => c.name).includes(searchResult.companies[idx]?.name))
                              .map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                {searchResult.table_data.columns.map((column, colIdx) => (
                                  <td key={colIdx} className="px-4 py-4 whitespace-nowrap text-sm">
                                    {column === 'Website' ? (
                                      <a
                                        href={row[column]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 flex items-center"
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Visit
                                      </a>
                                    ) : column === 'Match %' ? (
                                      <Badge variant={parseInt(row[column]) >= 70 ? "default" : "secondary"}>
                                        {row[column]}
                                      </Badge>
                                    ) : column === 'Company' ? (
                                      <span className="font-medium text-gray-900">{row[column]}</span>
                                    ) : column === 'Employees' ? (
                                      <span className="flex items-center">
                                        <Users className="h-3 w-3 mr-1 text-gray-400" />
                                        {row[column]}
                                      </span>
                                    ) : column === 'Location' ? (
                                      <span className="flex items-center">
                                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                        {row[column]}
                                      </span>
                                    ) : column === 'Founded' ? (
                                      <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                        {row[column]}
                                      </span>
                                    ) : (
                                      <span className="text-gray-700">{row[column]}</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    </div>
                  ) : (
                    /* Card View */
                    <ScrollArea className="h-[700px]">
                      <div className="space-y-4">
                        {filteredCompanies.map((company, idx) => (
                          <Card key={idx} className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    {company.additional_data?.is_person ? (
                                      <>
                                        <h3 className="font-bold text-xl text-gray-900">{company.name}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                          LinkedIn Profile
                                        </Badge>
                                      </>
                                    ) : (
                                      <h3 className="font-bold text-xl text-gray-900">{company.name}</h3>
                                    )}
                                    <Badge variant={company.confidence_score >= 70 ? "default" : "secondary"} className="text-xs">
                                      {company.confidence_score}% match
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                    {company.additional_data?.is_person ? (
                                      <>
                                        <span className="flex items-center">
                                          <Building2 className="h-4 w-4 mr-1" />
                                          {company.additional_data.job_title}
                                        </span>
                                        <span className="flex items-center">
                                          <Users className="h-4 w-4 mr-1" />
                                          {company.additional_data.company_name}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="flex items-center">
                                          <Building2 className="h-4 w-4 mr-1" />
                                          {company.industry}
                                        </span>
                                        {company.company_type && (
                                          <Badge variant="outline" className="text-xs">
                                            {company.company_type}
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-gray-700 mb-4 leading-relaxed">{company.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {company.additional_data?.is_person ? (
                                  <>
                                    <div className="flex items-center text-sm">
                                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                                      <span className="font-medium">Job Title:</span>
                                      <span className="ml-2">{company.additional_data.job_title}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm">
                                      <Building2 className="h-4 w-4 mr-2 text-green-500" />
                                      <span className="font-medium">Company:</span>
                                      <span className="ml-2">{company.additional_data.company_name}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center text-sm">
                                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                                      <span className="font-medium">Employees:</span>
                                      <span className="ml-2">
                                        {company.employee_count ? company.employee_count.toLocaleString() : company.employee_range}
                                      </span>
                                    </div>
                                  </>
                                )}
                                
                                {company.location && (
                                  <div className="flex items-center text-sm">
                                    <MapPin className="h-4 w-4 mr-2 text-green-500" />
                                    <span className="font-medium">Location:</span>
                                    <span className="ml-2">{company.location}</span>
                                  </div>
                                )}
                                
                                {company.founded && (
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                                    <span className="font-medium">Founded:</span>
                                    <span className="ml-2">{company.founded}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center text-sm">
                                  <Globe className="h-4 w-4 mr-2 text-orange-500" />
                                  <span className="font-medium">Source:</span>
                                  <span className="ml-2 text-xs">{company.search_source}</span>
                                </div>
                              </div>

                              {company.tools_detected && company.tools_detected.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center mb-2">
                                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                                    <span className="font-medium text-sm">
                                      {company.additional_data?.is_person ? "Tools Mentioned:" : "Tools Detected:"}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {company.tools_detected.map((tool, toolIdx) => (
                                      <Badge key={toolIdx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        {tool}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {company.match_reasons && company.match_reasons.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center mb-2">
                                    <Target className="h-4 w-4 mr-2 text-green-500" />
                                    <span className="font-medium text-sm">Why This Matches:</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {company.match_reasons.map((reason, reasonIdx) => (
                                      <li key={reasonIdx} className="flex items-start text-sm">
                                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-gray-600">{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-4 border-t">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {company.additional_data?.is_person ? "View LinkedIn" : "Visit Website"}
                                  </a>
                                </Button>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <BarChart3 className="h-3 w-3" />
                                  <span>Confidence: {company.confidence_score}%</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Search Criteria */}
              {searchResult.search_criteria && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Filter className="h-5 w-5 text-blue-600" />
                      <span>Search Criteria</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {searchResult.search_criteria.industry && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="font-medium">Industry:</span>
                        <Badge variant="outline">{searchResult.search_criteria.industry}</Badge>
                      </div>
                    )}
                    {searchResult.search_criteria.company_type && (
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline">{searchResult.search_criteria.company_type}</Badge>
                      </div>
                    )}
                    {(searchResult.search_criteria.employee_range_min || searchResult.search_criteria.employee_range_max) && (
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                        <span className="font-medium">Employees:</span>
                        <Badge variant="outline">
                          {searchResult.search_criteria.employee_range_min && searchResult.search_criteria.employee_range_max
                            ? `${searchResult.search_criteria.employee_range_min.toLocaleString()}-${searchResult.search_criteria.employee_range_max.toLocaleString()}`
                            : searchResult.search_criteria.employee_range_min
                            ? `${searchResult.search_criteria.employee_range_min.toLocaleString()}+`
                            : `Up to ${searchResult.search_criteria.employee_range_max.toLocaleString()}`}
                        </Badge>
                      </div>
                    )}
                    {searchResult.search_criteria.required_tools && searchResult.search_criteria.required_tools.length > 0 && (
                      <div className="p-2 bg-yellow-50 rounded">
                        <span className="font-medium block mb-2">Required Tools:</span>
                        <div className="flex flex-wrap gap-1">
                          {searchResult.search_criteria.required_tools.map((tool, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResult.search_criteria.company_examples && searchResult.search_criteria.company_examples.length > 0 && (
                      <div className="p-2 bg-orange-50 rounded">
                        <span className="font-medium block mb-2">Similar to:</span>
                        <div className="flex flex-wrap gap-1">
                          {searchResult.search_criteria.company_examples.map((example, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <Badge 
                        variant={searchResult.search_criteria.strict_matching ? "default" : "secondary"}
                        className="w-full justify-center"
                      >
                        {searchResult.search_criteria.strict_matching ? "🎯 Strict Matching" : "🔍 Flexible Matching"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search Events */}
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>AI Reasoning</span>
                  </CardTitle>
                  <CardDescription>
                    How the AI analyzed your query
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {searchResult.search_events?.length === 0 ? (
                        <p className="text-gray-500 text-sm">No search activity</p>
                      ) : (
                        searchResult.search_events?.map((event, idx) => (
                          <div key={idx} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                            {getEventIcon(event.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm break-words leading-relaxed">{event.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{event.timestamp}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Reasoning Summary */}
              {searchResult.reasoning && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      <span>Search Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 leading-relaxed">{searchResult.reasoning}</p>
                    {searchResult.execution_time && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Performance:</span>
                          <span className="text-green-600">{searchResult.execution_time.toFixed(1)}s</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentCompanyResearchAgent;