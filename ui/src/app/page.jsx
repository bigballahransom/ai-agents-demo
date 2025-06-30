'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Play, 
  Pause, 
  Filter,
  Download,
  Plus,
  Settings,
  Eye,
  ExternalLink,
  Linkedin,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

// CreateCampaignForm component
const CreateCampaignForm = ({ onCreateCampaign }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    job_titles_text: '',
    target_tools_text: '',
    department: '',
    company_size: '',
    industry: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse comma-separated values
      const jobTitles = formData.job_titles_text ? formData.job_titles_text.split(',').map(t => t.trim()) : [];
      const targetTools = formData.target_tools_text ? formData.target_tools_text.split(',').map(t => t.trim()) : [];

      const campaignData = {
        company_name: formData.company_name,
        job_titles: jobTitles,
        target_tools: targetTools,
        department: formData.department || null
      };

      await onCreateCampaign(campaignData);
      
      // Reset form
      setFormData({
        company_name: '',
        job_titles_text: '',
        target_tools_text: '',
        department: '',
        company_size: '',
        industry: ''
      });

      // Show success message or redirect
      alert('Campaign created successfully!');
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create New Campaign</h2>
        <p className="text-gray-600 mt-1">Set up AI agent to find prospects using specific tools</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Configuration</CardTitle>
          <CardDescription>Configure your AI agent search parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Name *</label>
                  <Input 
                    placeholder="e.g., TechCorp Inc"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Job Titles *</label>
                  <Textarea 
                    placeholder="e.g., VP Sales, Sales Director, Head of Sales (comma-separated)"
                    rows={3}
                    value={formData.job_titles_text}
                    onChange={(e) => setFormData({...formData, job_titles_text: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <Input 
                    placeholder="e.g., Sales, Marketing, Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tools to Detect *</label>
                  <Textarea 
                    placeholder="e.g., Salesforce, HubSpot, Pipedrive (comma-separated)"
                    rows={3}
                    value={formData.target_tools_text}
                    onChange={(e) => setFormData({...formData, target_tools_text: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Size</label>
                  <Select onValueChange={(value) => setFormData({...formData, company_size: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-50)</SelectItem>
                      <SelectItem value="small">Small (51-200)</SelectItem>
                      <SelectItem value="medium">Medium (201-1000)</SelectItem>
                      <SelectItem value="large">Large (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Industry</label>
                  <Select onValueChange={(value) => setFormData({...formData, industry: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS/Software</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Save as Draft
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Launch AI Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SalesAgentPlatform = () => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [agentRunning, setAgentRunning] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [agentEvents, setAgentEvents] = useState([]);
  const [currentCampaignId, setCurrentCampaignId] = useState(null);

  // Mock data for prospects
  const mockProspects = [
    {
      id: 1,
      name: "Sarah Chen",
      title: "VP of Sales",
      company: "TechCorp Inc.",
      department: "Sales",
      confidence: 92,
      toolsFound: ["Salesforce", "Outreach"],
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      email: "sarah.chen@techcorp.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      avatar: "/api/placeholder/40/40"
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      title: "Sales Director",
      company: "GrowthCo",
      department: "Sales",
      confidence: 87,
      toolsFound: ["HubSpot", "Salesforce"],
      linkedinUrl: "https://linkedin.com/in/mrodriguez",
      email: "m.rodriguez@growthco.com",
      location: "Austin, TX",
      avatar: "/api/placeholder/40/40"
    }
  ];

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:8000/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const createNewCampaign = async (campaignData) => {
    try {
      const response = await fetch('http://localhost:8000/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentCampaignId(data.campaign_id);
        
        // Add mock agent event
        const newEvent = {
          id: Date.now().toString(),
          type: "campaign",
          message: `Created campaign: ${campaignData.company_name}`,
          timestamp: new Date().toLocaleTimeString(),
          status: "success"
        };
        setAgentEvents(prev => [...prev, newEvent]);
        
        // Refresh campaigns list
        fetchCampaigns();
        
        return data;
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  const chatWithAgent = async (message) => {
    if (!currentCampaignId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${currentCampaignId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add agent response to events
        const newEvent = {
          id: Date.now().toString(),
          type: "response",
          message: data.response,
          timestamp: new Date().toLocaleTimeString(),
          status: "success"
        };
        setAgentEvents(prev => [...prev, newEvent]);
        
        return data;
      }
    } catch (error) {
      console.error('Error chatting with agent:', error);
    }
  };

  const startAgent = async () => {
    setAgentRunning(true);
    setSearchProgress(0);
    
    try {
      // Create a new campaign
      const response = await fetch('http://localhost:8000/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: "TechCorp Inc",
          job_titles: ["VP Sales", "Sales Director", "Sales Manager"],
          target_tools: ["Salesforce", "HubSpot", "Pipedrive"],
          department: "Sales"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Campaign created:', data);
        
        // Simulate progress
        const interval = setInterval(() => {
          setSearchProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setAgentRunning(false);
              return 100;
            }
            return prev + 10;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error starting agent:', error);
      setAgentRunning(false);
    }
  };

  const stopAgent = () => {
    setAgentRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">SalesAgent AI</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                AI Agent Ready
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="campaigns" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Prospects</span>
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Agent View</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Campaign</span>
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Active Campaigns</h2>
                <p className="text-gray-600 mt-1">AI-powered prospect discovery campaigns</p>
              </div>
              <Button onClick={() => setActiveTab('create')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            <div className="grid gap-6">
              {campaigns.length === 0 ? (
                <Card className="text-center p-8">
                  <CardContent>
                    <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-4">Create your first AI-powered prospecting campaign</p>
                    <Button onClick={() => setActiveTab('create')} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{campaign.name}</CardTitle>
                          <CardDescription className="mt-1">
                            Created {new Date(campaign.created_at).toLocaleDateString()}
                            {campaign.progress && ` • ${campaign.progress.prospects_found} prospects found`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={campaign.status === 'running' ? 'default' : 'secondary'}
                            className={campaign.status === 'running' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {campaign.status === 'running' ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Running
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {campaign.status}
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {campaign.progress && (
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Progress</span>
                              <span>{campaign.progress.prospects_found}/{campaign.progress.total_searched} prospects</span>
                            </div>
                            <Progress value={(campaign.progress.prospects_found / Math.max(campaign.progress.total_searched, 1)) * 100} className="h-2" />
                          </div>
                        )}
                        
                        {campaign.request && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Target Tools</p>
                              <div className="flex flex-wrap gap-1">
                                {campaign.request.target_tools?.map((tool) => (
                                  <Badge key={tool} variant="secondary" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Job Titles</p>
                              <div className="flex flex-wrap gap-1">
                                {campaign.request.job_titles?.map((title) => (
                                  <Badge key={title} variant="outline" className="text-xs">
                                    {title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setCurrentCampaignId(campaign.id);
                                setActiveTab('agent');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                          {campaign.status === 'running' && (
                            <Button variant="outline" size="sm" onClick={stopAgent}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Prospects Tab */}
          <TabsContent value="prospects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Prospects</h2>
                <p className="text-gray-600 mt-1">AI-verified prospects with tool usage data</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {mockProspects.map((prospect) => (
                <Card key={prospect.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={prospect.avatar} />
                          <AvatarFallback>{prospect.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{prospect.name}</h3>
                          <p className="text-gray-600">{prospect.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {prospect.company}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {prospect.location}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <Badge className="bg-green-100 text-green-700">
                          {prospect.confidence}% Match
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Linkedin className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Tools Detected</p>
                        <div className="flex flex-wrap gap-1">
                          {prospect.toolsFound.map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Contact Info</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          {prospect.email && <p>📧 {prospect.email}</p>}
                          {prospect.phone && <p>📞 {prospect.phone}</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Agent View Tab */}
          <TabsContent value="agent" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Control Panel */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-blue-600" />
                      Agent Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                        agentRunning ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Brain className={`h-10 w-10 ${
                          agentRunning ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <p className="mt-2 font-medium">
                        {agentRunning ? 'Agent Running' : 'Agent Ready'}
                      </p>
                    </div>
                    
                    {agentRunning && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{searchProgress}%</span>
                        </div>
                        <Progress value={searchProgress} />
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {!agentRunning ? (
                        <Button onClick={startAgent} className="flex-1 bg-green-600 hover:bg-green-700">
                          <Play className="h-4 w-4 mr-2" />
                          Start Agent
                        </Button>
                      ) : (
                        <Button onClick={stopAgent} variant="destructive" className="flex-1">
                          <Pause className="h-4 w-4 mr-2" />
                          Stop Agent
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Activity Feed */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Activity</CardTitle>
                    <CardDescription>Real-time agent actions and discoveries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {agentEvents.length === 0 ? (
                          <div className="text-center py-8">
                            <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">No agent activity yet</p>
                            <p className="text-sm text-gray-400">Start a campaign to see agent actions here</p>
                          </div>
                        ) : (
                          agentEvents.map((event) => (
                            <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                event.status === 'success' ? 'bg-green-500' : 
                                event.status === 'running' ? 'bg-blue-500' : 'bg-red-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm">{event.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{event.timestamp}</p>
                              </div>
                              {event.status === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : event.status === 'running' ? (
                                <Clock className="h-4 w-4 text-blue-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <CreateCampaignForm onCreateCampaign={createNewCampaign} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesAgentPlatform;